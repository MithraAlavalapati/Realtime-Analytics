import functions_framework
from flask_cors import cross_origin
import datetime
import json
import os
import uuid

# Move imports inside the function to avoid macOS fork() crash
from google.cloud import bigquery, pubsub_v1
from google.oauth2 import service_account

@functions_framework.http
@cross_origin()
def process_scroll_hover_event(request):
    """
    Processes a scroll/hover event from an HTTP request.
    Initializes BigQuery and Pub/Sub clients within the function scope.
    """
    # --- CONFIGURATION (can be local to the function) ---
    PROJECT_ID = os.environ.get('GCP_PROJECT_ID', 'svaraflow')
    DATASET_ID = os.environ.get('BIGQUERY_DATASET_ID', 'seller1_data')
    EVENT_TABLE_ID = os.environ.get('BIGQUERY_TABLE_ID_SCROLL_HOVER', 'scroll_hover_events')
    NOTIFICATION_TOPIC_ID = 'seller-notifications-topic'
    SERVICE_ACCOUNT_KEY_PATH = "key.json"

    client = None
    event_table_ref = None
    pubsub_publisher = None
    notification_topic_path = None

    try:
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_KEY_PATH, scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        client = bigquery.Client(project=PROJECT_ID, credentials=credentials)
        event_table_ref = client.dataset(DATASET_ID).table(EVENT_TABLE_ID)
        pubsub_publisher = pubsub_v1.PublisherClient(credentials=credentials)
        notification_topic_path = pubsub_publisher.topic_path(PROJECT_ID, NOTIFICATION_TOPIC_ID)
        print("DEBUG: BigQuery and Pub/Sub clients initialized within function scope.")
    except Exception as e:
        print(f"ERROR: Failed to initialize clients within function: {e}")
        return json.dumps({"status": "error", "message": "Cloud client initialization failed."}), 500

    # --- REST OF YOUR FUNCTION LOGIC ---
    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    if client is None or event_table_ref is None:
        return json.dumps({"status": "error", "message": "BigQuery client not ready."}), 500, response_headers
    if request.method == 'OPTIONS':
        return ('', 204, response_headers)
    if request.method != 'POST':
        return json.dumps({"status": "error", "message": "Method Not Allowed"}), 405, response_headers
    if not request.is_json:
        return json.dumps({"status": "error", "message": "Request body must be JSON"}), 400, response_headers

    try:
        event_data = request.get_json()
        print(f"DEBUG: Received payload: {event_data}") # Add this for better debugging

        # Updated to include all fields sent from your frontend
        required_fields = ['user_id', 'session_id', 'section_name', 'event_type', 'page_location', 'timestamp_utc', 
                   'device_type', 'browser_name', 'os_type', 'referrer_url', 'scroll_depth_pct']

        if not all(field in event_data for field in required_fields):
            missing_fields = [field for field in required_fields if field not in event_data]
            print(f"ERROR: Missing required fields: {missing_fields}")
            return json.dumps({"status": "error", "message": "Missing required fields.", "missing_fields": missing_fields}), 400, response_headers

        # Create the row to insert, matching the BigQuery table schema
        row_to_insert = {
            "event_id": str(uuid.uuid4()),
            "user_id": event_data.get('user_id'),
            "session_id": event_data.get('session_id'),
            "section_name": event_data.get('section_name'),
            "event_type": event_data.get('event_type'),
            #"scroll_depth_pct": event_data.get('scroll_depth_pct'),
            "page_url": event_data.get('page_location'),
            "referrer_url": event_data.get('referrer_url'),
            "utm_campaign": event_data.get('utm_campaign'),
            "utm_source": event_data.get('utm_source'),
            "utm_medium": event_data.get('utm_medium'),
            "device_type": event_data.get('device_type'),
            "browser_name": event_data.get('browser_name'),
            "os_type": event_data.get('os_type'),
            "timestamp_utc": event_data.get('timestamp_utc')
        }

        # Step 1: Log the event to BigQuery
        errors = client.insert_rows_json(event_table_ref, [row_to_insert])
        
        if errors:
            print(f"ERROR: BigQuery insert failed. Details:")
            for error in errors:
                row_content = error.get('row_content', 'N/A')
                error_reasons = error.get('errors', 'N/A')
                print(f"  Row content: {row_content}")
                print(f"  Error reasons: {error_reasons}")
            return json.dumps({"status": "error", "message": "BigQuery insert failed.", "details": errors}), 500, response_headers

        # Step 2: Send a real-time notification to the UI via Pub/Sub
        seller_map = {
            'Hot Promotions': 'general-promotions',
            'Shop by Store': 'general-promotions',
            'Shop by Category': 'general-promotions',
            'Featured Products': 'general-promotions',
        }
        
        section_name = event_data.get('section_name')
        if section_name in seller_map:
            seller_id = seller_map[section_name]
            notification_payload = {
                "seller_id": seller_id,
                "event_name": "section_hover",
                "message": f"A customer is hovering over the '{section_name}' section."
            }
            future = pubsub_publisher.publish(notification_topic_path, json.dumps(notification_payload).encode("utf-8"))
            print(f"Published notification for seller {seller_id}. Message ID: {future.result()}")
        
        print(f"Successfully inserted 'scroll_hover' event for section '{section_name}'.")
        return json.dumps({"status": "success", "inserted": True}), 200, response_headers

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return json.dumps({"status": "error", "message": str(e)}), 500, response_headers