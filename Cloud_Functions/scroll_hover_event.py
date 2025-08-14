import functions_framework
from flask_cors import cross_origin
import datetime
import json
import os
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# --- GLOBAL CONFIGURATION (for non-client-specific values) ---
PROJECT_ID = os.environ.get('GCP_PROJECT_ID', 'svaraflow')
DATASET_ID = os.environ.get('BIGQUERY_DATASET_ID', 'seller1_data')
EVENT_TABLE_ID = os.environ.get('BIGQUERY_TABLE_ID_SCROLL_HOVER', 'scroll_hover_events')
NOTIFICATION_TOPIC_ID = 'seller-notifications-topic'
# Use environment variable for service account key path, fallback to local file
SERVICE_ACCOUNT_KEY_PATH = os.environ.get('SERVICE_ACCOUNT_KEY_PATH', 'key.json')

# --- GLOBAL MAPPING LOGIC ---
SELLER_MAP = {
    'Hot Promotions': 'general-promotions',
    'Shop by Store': 'general-promotions',
    'Shop by Category': 'general-promotions',
    'Featured Products': 'general-promotions',
    'Trendy Threads': 'trendy-threads-seller',
    'Tech Emporium': 'tech-emporium-seller',
    'The Book Nook': 'book-nook-seller',
    'Active Zone': 'active-zone-seller',
}

STORE_MAP_REVERSE = {v: k for k, v in SELLER_MAP.items()}


@functions_framework.http
@cross_origin(origins=["*"])
def process_scroll_hover_event(request):
    """
    Processes scroll/hover events from an HTTP request.
    This function now handles both general section hovers and product hovers,
    logging to BigQuery and sending specific notifications.
    """
    # --- IMPORTANT: Move all Google Cloud client imports and initialization HERE ---
    # This ensures they are initialized within the worker process, avoiding macOS fork() issues.
    from google.cloud import bigquery, pubsub_v1
    from google.oauth2 import service_account
    from google.api_core.exceptions import GoogleAPIError

    bigquery_client = None
    bigquery_table_ref = None
    pubsub_publisher_client = None
    pubsub_notification_topic_path = None

    try:
        if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            credentials = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_KEY_PATH, scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
        else:
            # Fallback for deployed Cloud Function where credentials are auto-handled
            credentials = None 
            logging.info("SERVICE_ACCOUNT_KEY_PATH not found, assuming default Cloud Function credentials.")

        bigquery_client = bigquery.Client(project=PROJECT_ID, credentials=credentials)
        bigquery_table_ref = bigquery_client.dataset(DATASET_ID).table(EVENT_TABLE_ID)
        pubsub_publisher_client = pubsub_v1.PublisherClient(credentials=credentials)
        pubsub_notification_topic_path = pubsub_publisher_client.topic_path(PROJECT_ID, NOTIFICATION_TOPIC_ID)
        logging.info("DEBUG: BigQuery and Pub/Sub clients initialized within function scope.")
    except Exception as e:
        logging.error(f"ERROR: Failed to initialize clients within function: {e}")
        return json.dumps({"status": "error", "message": "Cloud client initialization failed."}), 500
    
    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    # Check if clients were initialized successfully inside the function
    if bigquery_client is None or bigquery_table_ref is None or pubsub_publisher_client is None:
        logging.error("Cloud clients not ready. Returning 500.")
        return json.dumps({"status": "error", "message": "Cloud client initialization failed."}), 500, response_headers
    
    if request.method == 'OPTIONS':
        return ('', 204, response_headers)
    if request.method != 'POST':
        return json.dumps({"status": "error", "message": "Method Not Allowed"}), 405, response_headers
    if not request.is_json:
        return json.dumps({"status": "error", "message": "Request body must be JSON"}), 400, response_headers

    try:
        event_data = request.get_json()
        logging.info(f"DEBUG: Received payload: {event_data}")

        event_name = event_data.get('event_name')

        if event_name == 'scroll_hover_event':
            required_fields = ['user_id', 'session_id', 'section_name','event_type', 'page_location', 'timestamp_utc', 
                               'device_type', 'browser_name', 'os_type', 'referrer_url', 'scroll_depth_pct']
        elif event_name == 'product_hover_event':
            required_fields = ['user_id', 'session_id', 'item_name', 'seller_id','page_location', 'timestamp_utc', 
                               'device_type', 'browser_name', 'os_type', 'referrer_url']
        else:
            return json.dumps({"status": "error", "message": "Invalid event name."}), 400, response_headers

        missing_fields = [field for field in required_fields if field not in event_data]
        if missing_fields:
            logging.error(f"ERROR: Missing required fields: {missing_fields}")
            return json.dumps({"status": "error", "message": "Missing required fields.", "missing_fields": missing_fields}), 400, response_headers

        section_name = event_data.get('section_name')
        
        # Determine seller_id and store_name for logging and notification
        # Prioritize seller_id from event_data, then from SELLER_MAP based on section_name
        seller_id_for_context = event_data.get('seller_id')
        if not seller_id_for_context and section_name:
            seller_id_for_context = SELLER_MAP.get(section_name)

        # Determine store_name for context
        # Prioritize store_name from event_data, then from STORE_MAP_REVERSE based on derived seller_id
        store_name_for_context = event_data.get('store_name')
        if not store_name_for_context and seller_id_for_context:
            store_name_for_context = STORE_MAP_REVERSE.get(seller_id_for_context)

        row_to_insert = {
            "event_id": str(uuid.uuid4()),
            "user_id": event_data.get('user_id'),
            "session_id": event_data.get('session_id'),
            "seller_id": seller_id_for_context,  # Use the derived seller_id
            "store_name": store_name_for_context, # Use the derived store_name
            "section_name": event_data.get('section_name'),
            "event_type": event_data.get('event_type'),
            "scroll_depth_pct": event_data.get('scroll_depth_pct'),
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
        
        if event_name == 'product_hover_event':
             row_to_insert['item_name'] = event_data.get('item_name')
             row_to_insert['item_category'] = event_data.get('item_category')

        # Insert into BigQuery
        errors = bigquery_client.insert_rows_json(bigquery_table_ref, [row_to_insert])
        
        if errors:
            logging.error(f"ERROR: BigQuery insert failed. Details: {errors}")
            for error in errors:
                row_content = error.get('row_content', 'N/A')
                error_reasons = error.get('errors', 'N/A')
                logging.error(f"  Row content: {row_content}")
                logging.error(f"  Error reasons: {error_reasons}")
            return json.dumps({"status": "error", "message": "BigQuery insert failed.", "details": errors}), 500, response_headers

        # Publish a message to the notification topic
        if seller_id_for_context:
            message = ""
            if event_name == 'product_hover_event':
                message = (f"A customer hovered over the '{event_data.get('item_name', 'unknown product')}' "
                           f"in the '{event_data.get('item_category', 'unknown')}' category.")
            else: # Message for general section hovers
                message = f"A customer is hovering over the '{section_name}' section."

            notification_payload = {
                "seller_id": seller_id_for_context,
                "event_name": event_name,
                "message": message,
                "item_name": event_data.get('item_name', None),
                "section_name": event_data.get('section_name', None),
            }
            
            future = pubsub_publisher_client.publish(pubsub_notification_topic_path, json.dumps(notification_payload).encode("utf-8"))
            logging.info(f"Published notification for seller {seller_id_for_context}. Message ID: {future.result()}")

        logging.info(f"Successfully inserted '{event_name}' event.")
        return json.dumps({"status": "success", "inserted": True}), 200, response_headers

    except json.JSONDecodeError as e:
        logging.error(f"ERROR: Invalid JSON payload: {e}")
        return json.dumps({"status": "error", "message": "Invalid JSON payload."}), 400, response_headers
    except GoogleAPIError as e:
        logging.error(f"ERROR: Google Cloud API error: {e}")
        return json.dumps({"status": "error", "message": f"Google Cloud API error: {str(e)}"}), 500, response_headers
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}", exc_info=True) # exc_info for full traceback
        return json.dumps({"status": "error", "message": str(e)}), 500, response_headers
