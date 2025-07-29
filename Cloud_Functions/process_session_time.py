# process_session_time.py
import functions_framework
from google.cloud import bigquery
import datetime
import json
import os
from google.oauth2 import service_account 

# --- CONFIGURE THESE (Matching your BQ project/dataset/table) ---
PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "svaraflow")
DATASET_ID = os.environ.get("BIGQUERY_DATASET_ID", "test_realtime_events")
TABLE_ID = os.environ.get("BIGQUERY_TABLE_ID", "events")

# --- Path to your downloaded service account key file ---
SERVICE_ACCOUNT_KEY_PATH = "key.json" # Make sure 'key.json' is in backend/ folder

client = None
table_ref = None

try:
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_KEY_PATH, scopes=["https://www.googleapis.com/auth/bigquery"]
    )
    client = bigquery.Client(project=PROJECT_ID, credentials=credentials)
    table_ref = client.dataset(DATASET_ID).table(TABLE_ID)
    print(f"BigQuery client initialized for Session_Time: {PROJECT_ID}.{DATASET_ID}.{TABLE_ID}")
except FileNotFoundError:
    print(f"ERROR: Service account key file not found at '{SERVICE_ACCOUNT_KEY_PATH}'. Ensure it's in backend/.")
    client = None
    table_ref = None
except Exception as e:
    print(f"ERROR: Failed to initialize BigQuery client for Session_Time: {e}")
    client = None
    table_ref = None

@functions_framework.http
def process_session_time(request): # <--- UNIQUE FUNCTION NAME
    """
    Cloud Function to handle 'Session_Time' events.
    """
    print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] Session_Time Request received. Method: {request.method}")

    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }
    if request.method == 'OPTIONS':
        return ('', 204, response_headers)

    if request.method == 'POST':
        request_json = request.get_json(silent=True)
        if request_json is None:
            print("Error: POST body empty or not JSON.")
            return json.dumps({"status": "error", "message": "Request body must be valid JSON"}), 400, response_headers

        event_name = request_json.get('event_name', 'unknown_event')
        if event_name != 'Session_Time': # <--- Specific check for this function
            print(f"Error: Mismatched event name '{event_name}'. Expected 'Session_Time'.")
            return json.dumps({"status": "error", "message": f"Expected 'Session_Time' event, got '{event_name}'"}), 400, response_headers

        # --- Extract attributes matching your schema ---
        event_timestamp_str = request_json.get('event_timestamp', datetime.datetime.now(datetime.timezone.utc).isoformat())
        ingestion_timestamp_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
        user_id = request_json.get('user_id')
        session_id = request_json.get('session_id')
        page_location = request_json.get('page_location')
        page_title = request_json.get('page_title')
        device_data = request_json.get('device', {}) 
        geo_data = request_json.get('geo', {})
        traffic_source_data = request_json.get('traffic_source', {})

        # Specific parameter for Session_Time, renamed to session_duration
        session_duration = request_json.get('session_duration')

        row_to_insert = {
            "event_name": event_name,
            "event_timestamp": event_timestamp_str, 
            "ingestion_timestamp": ingestion_timestamp_utc,
            "user_id": user_id,
            "session_id": session_id,
            "page_location": page_location,
            "page_title": page_title,
            "device": {
                "category": device_data.get('category'), "operating_system": device_data.get('operating_system'),
                "browser": device_data.get('browser'), "screen_resolution": device_data.get('screen_resolution')
            },
            "geo": {"country": geo_data.get('country'), "region": geo_data.get('region'), "city": geo_data.get('city')}, # Added 'region'
            "traffic_source": {"source": traffic_source_data.get('source'), "medium": traffic_source_data.get('medium'), "campaign": traffic_source_data.get('campaign')},
            "session_duration": session_duration # Renamed field
        }

        try:
            if client is None or table_ref is None:
                print("BigQuery client not ready.")
                return json.dumps({"status": "error", "message": "BigQuery service unavailable"}), 500, response_headers
            
            print(f"Attempting to insert '{event_name}' for '{user_id}'.")
            errors = client.insert_rows_json(table_ref, [row_to_insert])

            if errors:
                print(f"BigQuery insert errors for '{event_name}': {errors}")
                return json.dumps({"status": "error", "errors": errors}), 500, response_headers
            else:
                print(f"Successfully inserted '{event_name}' for '{user_id}'.")
                return json.dumps({"status": "success", "inserted": True, "event_name": event_name}), 200, response_headers

        except Exception as e:
            print(f"Unexpected error during BigQuery insert for '{event_name}': {e}")
            return json.dumps({"status": "error", "message": str(e)}), 500, response_headers
    else:
        print(f"Unsupported HTTP method: {request.method}")
        return json.dumps({"status": "error", "message": f"Method {request.method} not allowed. Only POST is supported."}), 405, response_headers