import functions_framework
from google.cloud import bigquery
from google.oauth2 import service_account
import google.generativeai as genai
import datetime
import json
import os
import tenacity
from dotenv import load_dotenv

# --- Load environment variables from .env file ---
# This is where the script finds your GOOGLE_API_KEY
load_dotenv()

# --- CONFIGURATION ---
PROJECT_ID = os.environ.get('GCP_PROJECT', 'svaraflow')
DATASET_ID = os.environ.get('DATASET_ID', 'test_realtime_events')
TABLE_ID = os.environ.get('TABLE_ID', 'user_reviews')
SERVICE_ACCOUNT_KEY_PATH = "key.json"

# --- Initialize Clients with key.json credentials ---
client = None
table_ref = None

try:
    # Load credentials from key.json
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_KEY_PATH, scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    
    # Initialize BigQuery client
    client = bigquery.Client(project=PROJECT_ID, credentials=credentials)
    table_ref = client.dataset(DATASET_ID).table(TABLE_ID)

    # Configure the Gemini API (key is now loaded from .env)
    genai.configure()

    print(f"DEBUG: BigQuery and Gemini clients initialized.")
except Exception as e:
    print(f"ERROR: Failed to initialize clients: {e}")
    client = None
    table_ref = None

# --- Prompt functions for AI tasks ---
def get_review_attributes_prompt(review_data):
    review_text = review_data.get('review_text', '')
    rating = review_data.get('rating', 'N/A')
    
    prompt = f"""
    You are a helpful e-commerce data analyst assistant. Your task is to analyze a product review and provide a structured JSON response.

    Review Details:
    Rating: {rating} stars
    Review Text: '{review_text}'

    Based on this information, generate a single JSON object. The JSON must contain the following keys:
    - "sentiment": A string, strictly "Positive", "Negative", or "Neutral", based on the review.
    - "key_customer_feedback": A single, concise sentence summarizing the review.
    - "potential_issues_or_highlights": A short phrase (max 10 words) describing any key issues (if negative) or highlights (if positive). If neutral, state "No specific issues or highlights".
    - "is_positive_review": A boolean (true or false). Set to true if sentiment is "Positive".

    **ENSURE the response is ONLY the JSON object, with no additional text, markdown formatting (like ```json), or conversational filler.**
    """
    return prompt

@tenacity.retry(
    wait=tenacity.wait_fixed(5),
    stop=tenacity.stop_after_attempt(3),
    reraise=True,
    retry=(tenacity.retry_if_exception_type(json.JSONDecodeError) |
           tenacity.retry_if_exception_type(ValueError) |
           tenacity.retry_if_exception_type(Exception))
)
def analyze_with_gemini_robust(prompt):
    if not prompt: raise ValueError("Prompt cannot be empty.")
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    if not response.text or not response.text.strip(): raise ValueError("Gemini API returned an empty or whitespace-only response.")
    cleaned_response_text = response.text.strip()
    if cleaned_response_text.startswith('```json') and cleaned_response_text.endswith('```'):
        cleaned_response_text = cleaned_response_text[len('```json'):-len('```')].strip()
    return cleaned_response_text


@functions_framework.http
def process_user_review_event(request):
    """
    A single Cloud Function that performs both ingestion and AI enrichment.
    """
    if client is None or table_ref is None:
        return json.dumps({"status": "error", "message": "BigQuery client not ready."}), 500, {'Access-Control-Allow-Origin': '*'}
    if request.method == 'OPTIONS':
        return ('', 204, {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '3600'})
    if request.method != 'POST':
        return json.dumps({"status": "error", "message": "Method Not Allowed"}), 405, {'Access-Control-Allow-Origin': '*'}
    if not request.is_json:
        return json.dumps({"status": "error", "message": "Request body must be JSON"}), 400, {'Access-Control-Allow-Origin': '*'}
    try:
        event_data = request.get_json()
        if 'event_name' not in event_data or event_data['event_name'] != 'user_reviews':
            print(f"Event name mismatch: Expected 'user_reviews', got '{event_data.get('event_name')}'.")
            return json.dumps({"status": "error", "message": "Event name mismatch."}), 400, {'Access-Control-Allow-Origin': '*'}

        # --- AI Enrichment (Synchronous) ---
        ai_data = None
        review_text = event_data.get('review', {}).get('review_text')
        if review_text:
            try:
                review_data = {'review_text': review_text, 'rating': event_data.get('review', {}).get('rating')}
                prompt = get_review_attributes_prompt(review_data)
                ai_response_text = analyze_with_gemini_robust(prompt)
                ai_data = json.loads(ai_response_text)
            except Exception as e:
                print(f"WARNING: AI analysis failed for review. Proceeding with raw data. Error: {e}")
                ai_data = None
        else:
            print("WARNING: Review text is empty. Skipping AI analysis.")

        # --- Ingestion (Single Insert) ---
        event_timestamp_str = event_data.get('event_timestamp', datetime.datetime.now(datetime.timezone.utc).isoformat())
        try:
            event_dt = datetime.datetime.fromisoformat(event_timestamp_str.replace('Z', '+00:00'))
            formatted_event_timestamp = event_dt.strftime('%Y-%m-%d %H:%M:%S.%f')
        except ValueError:
            print(f"WARNING: Could not parse event_timestamp '{event_timestamp_str}'. Using raw string.")
            formatted_event_timestamp = event_timestamp_str
            
        ingestion_dt = datetime.datetime.now(datetime.timezone.utc)
        formatted_ingestion_timestamp = ingestion_dt.strftime('%Y-%m-%d %H:%M:%S.%f')
        
        row_to_insert = {
            "event_name": event_data.get('event_name'),
            "event_timestamp": formatted_event_timestamp,
            "ingestion_timestamp": formatted_ingestion_timestamp,
            "user_id": event_data.get('user_id'),
            "session_id": event_data.get('session_id'),
            "page_location": event_data.get('page_location'),
            "item": { "item_id": event_data.get('item', {}).get('item_id'), "item_name": event_data.get('item', {}).get('item_name'), "item_category": event_data.get('item', {}).get('item_category'), "price": event_data.get('item', {}).get('price') },
            "review": { "review_id": event_data.get('review', {}).get('review_id'), "rating": event_data.get('review', {}).get('rating'), "review_text": event_data.get('review', {}).get('review_text') },
            "ai_analysis": json.dumps(ai_data) if ai_data else None,
            "sentiment": ai_data.get('sentiment') if ai_data else None,
            "key_customer_feedback": ai_data.get('key_customer_feedback') if ai_data else None,
            "potential_issues_or_highlights": ai_data.get('potential_issues_or_highlights') if ai_data else None,
            "is_positive_review": ai_data.get('is_positive_review') if ai_data else None,
            "device": { "category": event_data.get('device', {}).get('category'), "os": event_data.get('device', {}).get('os'), "browser": event_data.get('device', {}).get('browser') },
            "geo": { "country": event_data.get('geo', {}).get('country'), "region": event_data.get('geo', {}).get('region'), "city": event_data.get('geo', {}).get('city') },
            "traffic_source": { "source": event_data.get('traffic_source', {}).get('source'), "medium": event_data.get('traffic_source', {}).get('medium') },
            "viewed_reviews_count": event_data.get('viewed_reviews_count')
        }

        for field in ['viewed_reviews_count']:
            value = row_to_insert.get(field)
            if value is not None:
                try: row_to_insert[field] = int(value)
                except (ValueError, TypeError): row_to_insert[field] = None
        review_rating = row_to_insert.get('review', {}).get('rating')
        if review_rating is not None:
            try: row_to_insert['review']['rating'] = int(review_rating)
            except (ValueError, TypeError): row_to_insert['review']['rating'] = None
        item_price = row_to_insert.get('item', {}).get('price')
        if item_price is not None:
            try: row_to_insert['item']['price'] = float(item_price)
            except (ValueError, TypeError): row_to_insert['item']['price'] = None

        errors = client.insert_rows_json(table_ref, [row_to_insert])
        if errors:
            print(f"BigQuery insert errors detail: {errors}")
            return json.dumps({"status": "error", "errors": errors}), 500, {'Access-Control-Allow-Origin': '*'}
        
        print(f"Successfully inserted '{event_data.get('event_name')}' for user '{event_data.get('user_id')}'.")
        return json.dumps({"status": "success", "inserted": True}), 200, {'Access-Control-Allow-Origin': '*'}

    except Exception as e:
        print(f"An error occurred: {e}")
        return json.dumps({"status": "error", "message": str(e)}), 500, {'Access-Control-Allow-Origin': '*'}