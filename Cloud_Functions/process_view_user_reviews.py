# process_view_user_reviews.py
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
    print(f"BigQuery client initialized for View_User_Reviews: {PROJECT_ID}.{DATASET_ID}.{TABLE_ID}")
except FileNotFoundError:
    print(f"ERROR: Service account key file not found at '{SERVICE_ACCOUNT_KEY_PATH}'. Ensure it's in backend/.")
    client = None
    table_ref = None
except Exception as e:
    print(f"ERROR: Failed to initialize BigQuery client for View_User_Reviews: {e}")
    client = None
    table_ref = None

@functions_framework.http
def process_view_user_reviews(request): # <--- UNIQUE FUNCTION NAME
    """
    Cloud Function to handle 'View_User_Reviews' events.
    """
    print(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] View_User_Reviews Request received. Method: {request.method}")

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
        if event_name != 'View_User_Reviews': # <--- Specific check for this function
            print(f"Error: Mismatched event name '{event_name}'. Expected 'View_User_Reviews'.")
            return json.dumps({"status": "error", "message": f"Expected 'View_User_Reviews' event, got '{event_name}'"}), 400, response_headers

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

        # Specific parameters for View_User_Reviews, now top-level as confirmed
        # The 'product_id' refers to the product whose reviews are being viewed,
        # and 'viewed_reviews_count' is the number of reviews the user saw.
        product_id_for_view = request_json.get('product_id') # This is a top-level field for this event context
        viewed_reviews_count = request_json.get('viewed_reviews_count') # This is a top-level field

        # Initialize item and review as empty dictionaries if not present in payload
        # This ensures they are not sent unless explicitly populated
        item_data = {} # Assuming no item details for this event
        review_data = {} # Assuming no full review details for this event

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
            "geo": {"country": geo_data.get('country'), "region": geo_data.get('region'), "city": geo_data.get('city')},
            "traffic_source": {"source": traffic_source_data.get('source'), "medium": traffic_source_data.get('medium'), "campaign": traffic_source_data.get('campaign')},
            
            # Now correctly mapping to top-level fields
            "viewed_reviews_count": viewed_reviews_count, # Top-level field as confirmed
            "item": item_data, # Send empty or null record if not applicable
            "review": review_data # Send empty or null record if not applicable, assuming this event doesn't populate full review details
        }
        
        # Conditionally add product_id if it's considered a top-level context for this event
        # If your schema *only* has product_id nested under 'review', then this needs to be removed
        # and the frontend needs to send it under 'review'.
        # Based on your previous schema: 'product_id' is only nested under 'review'.
        # Let's remove the top-level product_id from here and assume it should be null for this event
        # unless it's explicitly part of the 'review' record for this event.
        # Given the error, the schema you are working with does NOT have a top-level 'product_id'.
        # The frontend's `simulateViewUserReviews` was sending a top-level `product_id`.
        # We need to make them consistent.

        # Re-evaluating based on your schema. If 'product_id' is *only* under 'review' record:
        # Then for 'View_User_Reviews' if we want to associate it with a product, we must
        # send it within the 'review' record even if other 'review' fields are null.
        # The previous error "no such field: number_of_reviews_viewed." was from trying to nest
        # 'number_of_reviews_viewed' within 'review' when the schema didn't allow it.

        # Let's assume the following for View_User_Reviews:
        # - The main metric is `viewed_reviews_count` (top-level).
        # - The product context is `item.item_id` (since `product_id` is specific to the `review` RECORD itself).
        # This aligns better with "viewing reviews *for a product*".

        # So, the frontend should send:
        # {
        #   event_name: 'View_User_Reviews',
        #   viewed_reviews_count: <count>,
        #   item: { item_id: <product_id> }
        # }

        # And the backend should process it like this:
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
            "geo": {"country": geo_data.get('country'), "region": geo_data.get('region'), "city": geo_data.get('city')},
            "traffic_source": {"source": traffic_source_data.get('source'), "medium": traffic_source_data.get('medium'), "campaign": traffic_source_data.get('campaign')},
            
            "viewed_reviews_count": viewed_reviews_count, # This is a top-level field
            "item": {"item_id": request_json.get('item', {}).get('item_id')}, # Associate with item.item_id for context
            # 'review' record will be null/empty for this event as per its definition of being for submitted reviews
            # unless your schema allows `review.product_id` for viewing context without other review details.
            # If `review.product_id` is the ONLY relevant field in 'review' for this event,
            # you could explicitly set `review: {"product_id": review_data.get('product_id')}` and send that.
            # But `item.item_id` is generally more standard for product context.
            # Let's stick with `item.item_id` for consistency with `View_Product_Details`.
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