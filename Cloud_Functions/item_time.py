import functions_framework
import datetime
import json
import os
from flask_cors import cross_origin

# --- Cloud Function: Item Time Tracker ---
@functions_framework.http
@cross_origin()
def track_item_time_event(request):
    """
    Processes item click and time events, logs to BigQuery, and sends conditional notifications.
    """
    from google.cloud import bigquery, pubsub_v1

    # Configuration for your GCP project
    PROJECT_ID = os.environ.get('GCP_PROJECT_ID', 'svaraflow')
    DATASET_ID = os.environ.get('BIGQUERY_DATASET_ID', 'seller1_data')
    EVENT_TABLE_ID = os.environ.get('BIGQUERY_TABLE_ID_ITEM_TIME', 'item_time')
    NOTIFICATION_TOPIC_ID = 'seller-notifications-topic'

    try:
        # Initialize Google Cloud clients
        client = bigquery.Client(project=PROJECT_ID)
        event_table_ref = client.dataset(DATASET_ID).table(EVENT_TABLE_ID)
        pubsub_publisher = pubsub_v1.PublisherClient()
        notification_topic_path = pubsub_publisher.topic_path(PROJECT_ID, NOTIFICATION_TOPIC_ID)
    except Exception as e:
        # Provide a more detailed error message to aid with local debugging
        error_message = f"Cloud client initialization failed: {e}. Please ensure GOOGLE_APPLICATION_CREDENTIALS is set and has correct permissions."
        print(f"ERROR: {error_message}")
        return json.dumps({"status": "error", "message": error_message}), 500

    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    if request.method == 'OPTIONS':
        return ('', 204, response_headers)
    if request.method != 'POST':
        return json.dumps({"status": "error", "message": "Method Not Allowed"}), 405, response_headers
    if not request.is_json and request.content_type != 'text/plain':
        return json.dumps({"status": "error", "message": "Request body must be JSON"}), 400, response_headers

    try:
        if request.is_json:
            event_data = request.get_json()
        else:
            event_data = json.loads(request.data.decode('utf-8'))
        
        # --- NEW: Log the incoming payload for easier debugging ---
        print(f"DEBUG: Received payload: {event_data}")

        event_name = event_data.get('event_name')
        
        # --- CORRECTED VALIDATION LOGIC ---
        common_fields = ['event_name', 'event_timestamp', 'session_id', 'item_id']
        if not all(field in event_data for field in common_fields):
            return json.dumps({"status": "error", "message": "Missing required common fields."}), 400, response_headers

        if event_name in ['item_time_realtime', 'item_time_final']:
            if not all(field in event_data for field in ['duration_on_item', 'engagement_level']):
                return json.dumps({"status": "error", "message": "Missing required fields for time-based event."}), 400, response_headers
        elif event_name == 'item_click':
            # 'item_click' events don't need duration or engagement_level
            pass
        else:
            return json.dumps({"status": "error", "message": "Event name mismatch."}), 400, response_headers

        row_to_insert = {
            "event_name": event_data.get('event_name'),
            "event_timestamp": event_data.get('event_timestamp'),
            "ingestion_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "user_id": event_data.get('user_id'),
            "session_id": event_data.get('session_id'),
            "seller_id": event_data.get('seller_id'),
            "store_name": event_data.get('store_name'),
            "item_id": event_data.get('item_id'),
            "duration_on_item": event_data.get('duration_on_item', 0),
            "engagement_level": event_data.get('engagement_level', 'click'),
            "device": event_data.get('device'),
            "geo": event_data.get('geo'),
            "traffic_source": event_data.get('traffic_source'),
        }

        # --- Enhanced error handling for BigQuery insert ---
        errors = client.insert_rows_json(event_table_ref, [row_to_insert])
        if errors:
            print(f"BigQuery insert errors detail: {errors}")
            # The errors from BigQuery can contain valuable context for debugging.
            return json.dumps({"status": "error", "message": "BigQuery insertion failed.", "errors": errors}), 500, response_headers
        else:
            print("Successfully inserted event into BigQuery.")

        seller_id = event_data.get('seller_id')
        store_name = event_data.get('store_name')
        item_id = event_data.get('item_id')
        engagement_level = event_data.get('engagement_level')
        duration_on_item = event_data.get('duration_on_item', 0)

        if seller_id and store_name and item_id:
            notification_message = ""
            if engagement_level == 'click':
                notification_message = f"A customer clicked on item {item_id} in your store."
            elif engagement_level == 'high_realtime':
                notification_message = f"🚨 High Interest! A customer has been on item {item_id} for over 40s. Engage now!"
            elif engagement_level == 'high_final':
                notification_message = f"🌟 A customer spent {duration_on_item}s on item {item_id}, showing high engagement."
            elif engagement_level == 'low_final':
                notification_message = f"A customer spent {duration_on_item}s on item {item_id}."
            
            notification_payload = {
                "seller_id": seller_id,
                "store_name": store_name,
                "event_name": event_name,
                "message": notification_message,
                "full_log": row_to_insert
            }
            future = pubsub_publisher.publish(notification_topic_path, json.dumps(notification_payload).encode("utf-8"))
            print(f"Published notification for seller {seller_id}. Message ID: {future.result()}")

        return json.dumps({"status": "success", "inserted": True}), 200, response_headers

    except Exception as e:
        print(f"An error occurred: {e}")
        return json.dumps({"status": "error", "message": str(e)}), 500, response_headers