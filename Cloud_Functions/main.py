import functions_framework
from google.cloud import bigquery
import datetime
import json
import os
# uuid is no longer strictly needed if event_id is removed from schema
# from dotenv import load_dotenv

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("python-dotenv not found. Assuming deployment environment or no .env file needed.")


PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "svaraflow")
DATASET_ID = os.environ.get("BIGQUERY_DATASET_ID", "test_realtime_events")
TABLE_ID = os.environ.get("BIGQUERY_TABLE_ID", "events")

client = None
table_ref = None

try:
    client = bigquery.Client(project=PROJECT_ID)
    table_ref = client.dataset(DATASET_ID).table(TABLE_ID)
    print(f"BigQuery client initialized successfully for table: {PROJECT_ID}.{DATASET_ID}.{TABLE_ID}")
except Exception as e:
    print(f"ERROR: Failed to initialize BigQuery client at startup: {e}")
    client = None
    table_ref = None

@functions_framework.http
def track_ecommerce_event(request):
    print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Request received. Method: {request.method}")

    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }

    if request.method == 'OPTIONS':
        print("Handling OPTIONS (CORS preflight) request by returning 204 No Content.")
        return ('', 204, response_headers)

    if request.method == 'POST':
        request_json = None
        try:
            if request.data:
                request_json = json.loads(request.data)
            else:
                print("Error: POST request body is empty. Returning 400 Bad Request.")
                return json.dumps({"status": "error", "message": "Request body is empty"}), 400, response_headers

        except json.JSONDecodeError as e:
            print(f"Error: POST request body is not valid JSON. Details: {e}. Returning 400 Bad Request.")
            return json.dumps({"status": "error", "message": f"Request body is not valid JSON: {e}"}), 400, response_headers
        except Exception as e:
            print(f"An unexpected error occurred while parsing JSON: {e}. Returning 400 Bad Request.")
            return json.dumps({"status": "error", "message": f"An unexpected error occurred while parsing JSON: {e}"}), 400, response_headers

        event_name = request_json.get('event_name')
        event_timestamp_str = request_json.get('event_timestamp')

        if not all([event_name, event_timestamp_str]):
            missing_fields = [f for f in ['event_name', 'event_timestamp'] if not request_json.get(f)]
            print(f"Error: Missing crucial fields: {', '.join(missing_fields)}. Returning 400 Bad Request.")
            return json.dumps({"status": "error", "message": f"Missing crucial fields: {', '.join(missing_fields)}"}), 400, response_headers

        # --- MODIFICATION START ---
        try:
            # Parse client timestamp
            event_timestamp_dt = datetime.datetime.fromisoformat(event_timestamp_str.replace('Z', '+00:00'))
            # Format event_timestamp to match BigQuery's preferred string format for TIMESTAMP
            # Ensure it's UTC and without the 'Z' or explicit timezone offset string if BigQuery is particular.
            # Python's default isoformat might still include a timezone if datetime object is timezone-aware.
            # Best practice for BigQuery TIMESTAMP is often a naive datetime string.
            # Let's ensure it's a naive UTC string.
            event_timestamp_bq = event_timestamp_dt.replace(tzinfo=None).strftime('%Y-%m-%d %H:%M:%S.%f')
        except ValueError:
            print(f"Error: Invalid event_timestamp format received: '{event_timestamp_str}'. Expected ISO 8601. Returning 400 Bad Request.")
            return json.dumps({"status": "error", "message": "Invalid event_timestamp format. Expected ISO 8601."}), 400, response_headers

        # Derive server-side ingestion timestamp
        ingestion_timestamp_dt = datetime.datetime.now(datetime.timezone.utc)
        # Format ingestion_timestamp to match BigQuery's preferred string format for TIMESTAMP
        ingestion_timestamp_bq = ingestion_timestamp_dt.replace(tzinfo=None).strftime('%Y-%m-%d %H:%M:%S.%f')
        # --- MODIFICATION END ---

        user_id = request_json.get('user_id')
        session_id = request_json.get('session_id')
        page_location = request_json.get('page_location')
        page_title = request_json.get('page_title')

        device_data = request_json.get('device', {})
        device = {
            "category": device_data.get('category'),
            "operating_system": device_data.get('operating_system'),
            "browser": device_data.get('browser'),
            "screen_resolution": device_data.get('screen_resolution')
        }

        geo_data = request_json.get('geo', {})
        geo = {
            "country": geo_data.get('country'),
            "region": geo_data.get('region'),
            "city": geo_data.get('city')
        }

        traffic_source_data = request_json.get('traffic_source', {})
        traffic_source = {
            "source": traffic_source_data.get('source'),
            "medium": traffic_source_data.get('medium'),
            "campaign": traffic_source_data.get('campaign')
        }

        rows_to_insert = [
            {
                "event_name": event_name,
                "event_timestamp": event_timestamp_bq,
                "ingestion_timestamp": ingestion_timestamp_bq,
                "user_id": user_id,
                "session_id": session_id,
                "page_location": page_location,
                "page_title": page_title,
                "device": device,
                "geo": geo,
                "traffic_source": traffic_source
            }
        ]

        try:
            if client is None or table_ref is None:
                print("BigQuery client is NOT READY. Returning 500.")
                return json.dumps({"status": "error", "message": "BigQuery service unavailable"}), 500, response_headers

            print(f"Attempting to stream insert event: '{event_name}' into BigQuery.")
            errors = client.insert_rows_json(table_ref, rows_to_insert)

            if errors:
                print(f"BigQuery streaming insert failed for some rows. Errors: {errors}")
                return json.dumps({"status": "error", "message": "Failed to insert some rows into BigQuery", "errors": errors}), 500, response_headers
            else:
                print(f"Successfully inserted event: '{event_name}' into BigQuery.")
                return json.dumps({"status": "success", "inserted": True, "event_name": event_name}), 200, response_headers

        except Exception as e:
            print(f"An unexpected error occurred during BigQuery insert: {e}. Returning 500.")
            return json.dumps({"status": "error", "message": f"An unexpected server error occurred: {str(e)}"}), 500, response_headers

    else:
        print(f"Unsupported HTTP method received: '{request.method}'. Returning 405 Method Not Allowed.")
        return json.dumps({"status": "error", "message": f"Method {request.method} not allowed. Only POST is supported for data."}), 405, response_headers