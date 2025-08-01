import functions_framework
from google.cloud import bigquery
from google.oauth2 import service_account
import datetime
import json
import os

# --- CONFIGURATION ---
PROJECT_ID = os.environ.get('GCP_PROJECT', 'svaraflow')
DATASET_ID = os.environ.get('DATASET_ID', 'test_realtime_events')
TABLE_ID = os.environ.get('TABLE_ID', 'scroll')

# Define the path to your service account key file
# For local testing, ensure 'key.json' is in the same directory as this script.
# For production, this should be removed in favor of the Cloud Function's
# built-in service account.
SERVICE_ACCOUNT_KEY_PATH = "key.json"

# --- Initialize BigQuery client ---
client = None
table_ref = None

try:
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_KEY_PATH, scopes=["https://www.googleapis.com/auth/bigquery"]
    )
    client = bigquery.Client(project=PROJECT_ID, credentials=credentials)
    table_ref = client.dataset(DATASET_ID).table(TABLE_ID)
    print(f"DEBUG: BigQuery client initialized for table: {PROJECT_ID}.{DATASET_ID}.{TABLE_ID}")
except FileNotFoundError:
    print(f"WARNING: Service account key file not found at '{SERVICE_ACCOUNT_KEY_PATH}'. Falling back to default credentials.")
    try:
        client = bigquery.Client(project=PROJECT_ID)
        table_ref = client.dataset(DATASET_ID).table(TABLE_ID)
    except Exception as e:
        print(f"ERROR: Failed to initialize BigQuery client with any credentials: {e}")
        client = None
        table_ref = None
except Exception as e:
    print(f"ERROR: Failed to initialize BigQuery client with service account key: {e}")
    client = None
    table_ref = None

# --- Cloud Function: Scroll Event Tracker ---
@functions_framework.http
def process_scroll_event(request):
    """
    Cloud Function to handle 'scroll' events and insert them into the
    'scroll' BigQuery table using streaming inserts.
    """
    if client is None or table_ref is None:
        return json.dumps({"status": "error", "message": "BigQuery client not ready."}), 500, {'Access-Control-Allow-Origin': '*'}

    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return ('', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        })

    if request.method != 'POST':
        return json.dumps({"status": "error", "message": "Method Not Allowed"}), 405, {'Access-Control-Allow-Origin': '*'}

    if not request.is_json:
        return json.dumps({"status": "error", "message": "Request body must be JSON"}), 400, {'Access-Control-Allow-Origin': '*'}

    try:
        event_data = request.get_json()

        # Validate that the event is a 'scroll' event
        if 'event_name' not in event_data or event_data['event_name'] != 'scroll':
            print(f"Event name mismatch: Expected 'scroll', got '{event_data.get('event_name')}'.")
            return json.dumps({"status": "error", "message": "Event name mismatch."}), 400, {'Access-Control-Allow-Origin': '*'}

        # Parse and reformat timestamps for BigQuery
        event_timestamp_str = event_data.get('event_timestamp', datetime.datetime.now(datetime.timezone.utc).isoformat())
        try:
            event_dt = datetime.datetime.fromisoformat(event_timestamp_str.replace('Z', '+00:00'))
            formatted_event_timestamp = event_dt.strftime('%Y-%m-%d %H:%M:%S.%f')
        except ValueError:
            print(f"WARNING: Could not parse event_timestamp '{event_timestamp_str}'. Using raw string.")
            formatted_event_timestamp = event_timestamp_str
            
        ingestion_dt = datetime.datetime.now(datetime.timezone.utc)
        formatted_ingestion_timestamp = ingestion_dt.strftime('%Y-%m-%d %H:%M:%S.%f')
        
        # Prepare the row to be inserted, matching the BigQuery schema
        row_to_insert = {
            "event_name": event_data.get('event_name'),
            "event_timestamp": formatted_event_timestamp,
            "ingestion_timestamp": formatted_ingestion_timestamp,
            "user_id": event_data.get('user_id'),
            "session_id": event_data.get('session_id'),
            "page_location": event_data.get('page_location'),
            "page_title": event_data.get('page_title'),
            "scroll_depth_percentage": event_data.get('scroll_depth_percentage'),
            "device": {
                "category": event_data.get('device', {}).get('category'),
                "os": event_data.get('device', {}).get('os'),
                "browser": event_data.get('device', {}).get('browser')
            },
            "geo": {
                "country": event_data.get('geo', {}).get('country'),
                "region": event_data.get('geo', {}).get('region'),
                "city": event_data.get('geo', {}).get('city')
            },
            "traffic_source": {
                "source": event_data.get('traffic_source', {}).get('source'),
                "medium": event_data.get('traffic_source', {}).get('medium')
            },
        }
        
        # Ensure scroll_depth_percentage is a valid integer before inserting
        if row_to_insert.get('scroll_depth_percentage') is not None:
            try:
                row_to_insert['scroll_depth_percentage'] = int(row_to_insert['scroll_depth_percentage'])
            except (ValueError, TypeError):
                print(f"WARNING: scroll_depth_percentage '{row_to_insert['scroll_depth_percentage']}' is not a valid integer. Defaulting to None.")
                row_to_insert['scroll_depth_percentage'] = None

        print(f"Attempting to insert '{event_data.get('event_name')}' for user '{event_data.get('user_id')}'.")
        errors = client.insert_rows_json(table_ref, [row_to_insert])

        if errors:
            print(f"BigQuery insert errors detail: {errors}")
            return json.dumps({"status": "error", "errors": errors}), 500, {'Access-Control-Allow-Origin': '*'}

        print(f"Successfully inserted '{event_data.get('event_name')}' for user '{event_data.get('user_id')}'.")
        return json.dumps({"status": "success", "inserted": True}), 200, {'Access-Control-Allow-Origin': '*'}

    except Exception as e:
        print(f"An error occurred: {e}")
        return json.dumps({"status": "error", "message": str(e)}), 500, {'Access-Control-Allow-Origin': '*'}