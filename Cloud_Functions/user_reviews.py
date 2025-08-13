import functions_framework
from flask_cors import cross_origin
import datetime
import json
import os

# Do NOT import google.cloud libraries at the top level.
# They are moved inside the function to avoid the macOS fork() crash.

@functions_framework.http
@cross_origin()
def process_user_reviews_event(request):
    """
    Processes a user reviews event from an HTTP request.
    Initializes BigQuery and Pub/Sub clients within the function scope.
    """
    # --- IMPORTANT: Move all imports and client initialization HERE ---
    # This ensures these libraries are loaded and initialized within each worker process,
    # AFTER the fork() operation, preventing the macOS Objective-C runtime conflict.
    from google.cloud import bigquery, pubsub_v1
    from google.oauth2 import service_account

    # --- CONFIGURATION (can be local to the function) ---
    PROJECT_ID = os.environ.get('GCP_PROJECT_ID', 'svaraflow')
    DATASET_ID = os.environ.get('BIGQUERY_DATASET_ID', 'seller1_data')
    EVENT_TABLE_ID = os.environ.get('BIGQUERY_TABLE_ID_USER_REVIEWS', 'user_reviews')
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
        
        required_top_level = ['event_name', 'event_timestamp', 'session_id', 'page_location', 'seller_id']
        required_item = ['item_id']
        required_review = ['review_id'] 
        required_device = ['category', 'os', 'browser']
        required_geo = ['country', 'region', 'city']

        if not all(field in event_data for field in required_top_level):
            return json.dumps({"status": "error", "message": "Missing required top-level fields."}), 400, response_headers
        if event_data.get('event_name') != 'user_reviews':
            return json.dumps({"status": "error", "message": "Event name mismatch."}), 400, response_headers
        if not all(field in event_data.get('item', {}) for field in required_item):
            return json.dumps({"status": "error", "message": "Missing required 'item' fields."}), 400, response_headers
        if not all(field in event_data.get('review', {}) for field in required_review):
            return json.dumps({"status": "error", "message": "Missing required 'review' fields."}), 400, response_headers
        if not all(field in event_data.get('device', {}) for field in required_device):
            return json.dumps({"status": "error", "message": "Missing required device fields."}), 400, response_headers
        if not all(field in event_data.get('geo', {}) for field in required_geo):
            return json.dumps({"status": "error", "message": "Missing required geo fields."}), 400, response_headers

        row_to_insert = {
            "event_name": event_data.get('event_name'),
            "event_timestamp": event_data.get('event_timestamp'),
            "ingestion_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "user_id": event_data.get('user_id'),
            "session_id": event_data.get('session_id'),
            "seller_id": event_data.get('seller_id'),
            "store_name": event_data.get('store_name'),
            "page_location": event_data.get('page_location'),
            "page_duration_seconds": event_data.get('page_duration_seconds'),
            "item": {
                "item_id": event_data.get('item', {}).get('item_id'),
                "item_name": event_data.get('item', {}).get('item_name'),
                "item_category": event_data.get('item', {}).get('item_category'),
                "price": event_data.get('item', {}).get('price')
            } if event_data.get('item') else None,
            "review": {
                "review_id": event_data.get('review', {}).get('review_id'),
                "rating": event_data.get('review', {}).get('rating'),
                "review_text": event_data.get('review', {}).get('review_text')
            } if event_data.get('review') else None,
            "review_images_count": event_data.get('review_images_count'),
            "reviewer_name": event_data.get('reviewer_name'),
            "device": {
                "category": event_data.get('device', {}).get('category'),
                "os": event_data.get('device', {}).get('os'),
                "browser": event_data.get('device', {}).get('browser')
            } if event_data.get('device') else None,
            "geo": {
                "country": event_data.get('geo', {}).get('country'),
                "region": event_data.get('geo', {}).get('region'),
                "city": event_data.get('geo', {}).get('city')
            } if event_data.get('geo') else None,
            "traffic_source": {
                "source": event_data.get('traffic_source', {}).get('source'),
                "medium": event_data.get('traffic_source', {}).get('medium')
            } if event_data.get('traffic_source') else None,
        }

        errors = client.insert_rows_json(event_table_ref, [row_to_insert])
        
        if errors:
            print(f"BigQuery insert errors detail: {errors}")
            return json.dumps({"status": "error", "errors": errors}), 500, response_headers
        
        seller_id = event_data.get('seller_id')
        store_name = event_data.get('store_name')
        if seller_id and store_name:
            notification_payload = {
                "seller_id": seller_id,
                "store_name": store_name,
                "event_name": event_data.get('event_name'),
                "item_id": event_data.get('item', {}).get('item_id'),
                "message": f"A new review was submitted for your product: {event_data.get('item', {}).get('item_name')}"
            }
            future = pubsub_publisher.publish(notification_topic_path, json.dumps(notification_payload).encode("utf-8"))
            print(f"Published notification for seller {seller_id}. Message ID: {future.result()}")
        
        print(f"Successfully inserted 'user_reviews' event for user '{event_data.get('user_id')}'.")
        return json.dumps({"status": "success", "inserted": True}), 200, response_headers

    except Exception as e:
        print(f"An error occurred: {e}")
        return json.dumps({"status": "error", "message": str(e)}), 500, response_headers