# This file should be saved as: ANALYTICS/Cloud_Functions/page_view_tracker.py

import functions_framework
import json
import os
from datetime import datetime
from google.cloud import bigquery
from dotenv import load_dotenv
from flask import Response

# Load environment variables from .env file (for local testing)
load_dotenv()

# --- CONFIGURATION ---
# Read configuration from environment variables
GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID')
BIGQUERY_DATASET_ID = os.environ.get('BIGQUERY_DATASET_ID')
BIGQUERY_TABLE_ID = os.environ.get('BIGQUERY_TABLE_ID')

# Validate that environment variables are loaded
if not all([GCP_PROJECT_ID, BIGQUERY_DATASET_ID, BIGQUERY_TABLE_ID]):
    raise ValueError("Missing one or more BigQuery environment variables (GCP_PROJECT_ID, BIGQUERY_DATASET_ID, BIGQUERY_TABLE_ID).")

# --- Initialize BigQuery client ---
try:
    client = bigquery.Client(project=GCP_PROJECT_ID)
    table_id = f"{GCP_PROJECT_ID}.{BIGQUERY_DATASET_ID}.{BIGQUERY_TABLE_ID}"
    print(f"DEBUG: BigQuery client initialized successfully for table: {table_id}")
except Exception as e:
    print(f"ERROR: Failed to initialize BigQuery client at startup: {e}")
    client = None
    table_id = None
    raise # Re-raise to stop function startup if client fails to initialize

# --- Reusable function to set CORS headers ---
def set_cors_headers(response):
    response.headers.set('Access-Control-Allow-Origin', 'http://127.0.0.1:5500')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.set('Access-Control-Max-Age', '3600')
    response.headers.set('Access-Control-Allow-Credentials', 'true')

# --- Reusable function to insert data into BigQuery ---
def insert_into_bigquery(event_data):
    # Ensure client and table_id are available before proceeding
    if client is None or table_id is None:
        raise Exception("BigQuery client or table_id not initialized. Cannot insert data.")

    # Add ingestion timestamp
    event_data['ingestion_timestamp'] = datetime.utcnow().isoformat() + 'Z'

    # Ensure top-level RECORD fields exist with default empty dicts if not provided
    # This prevents BigQuery errors for missing RECORD fields, assuming they are NULLABLE.
    event_data.setdefault('item', {})
    event_data.setdefault('promotion', {})
    event_data.setdefault('review', {})

    # The event_data received from frontend should already contain fields like
    # 'item', 'promotion', 'review', 'scroll_depth_percentage', 'zoom_level' directly.

    # Clean up empty record fields if they are sent empty by frontend
    if 'item' in event_data and not any(event_data['item'].values()):
        del event_data['item']
    if 'promotion' in event_data and not any(event_data['promotion'].values()):
        del event_data['promotion']
    if 'review' in event_data and not any(event_data['review'].values()):
        del event_data['review']
        
    rows_to_insert = [event_data]
    
    try:
        errors = client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            print(f"BigQuery insert errors detail: {errors}")
            raise Exception(f"BigQuery insert failed: {errors}")
        print(f"Successfully processed event: {event_data.get('event_name', 'unknown')}")
        return True
    except Exception as e:
        print(f"ERROR inserting {event_data.get('event_name', 'unknown')} into BigQuery: {e}")
        raise

# --- Cloud Function: Page View Tracker ---
@functions_framework.http
def page_view_tracker(request):
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response = Response('')
        set_cors_headers(response)
        return response

    if request.method != 'POST':
        response = Response('Method Not Allowed', status=405)
        set_cors_headers(response)
        return response

    if not request.is_json:
        response = Response('Request body must be JSON', status=400)
        set_cors_headers(response)
        return response

    try:
        event_data = request.get_json()
        
        # Ensure the event name is 'page_view' for this function
        if 'event_name' not in event_data or event_data['event_name'] != 'page_view':
            print(f"Event name mismatch: Expected 'page_view', got '{event_data.get('event_name')}'. Forcing to 'page_view'.")
            event_data['event_name'] = 'page_view'

        insert_into_bigquery(event_data)
        
        response = Response('Page view ingested.', status=200)
        set_cors_headers(response)
        return response
    except Exception as e:
        print(f"An error occurred in page_view_tracker: {e}")
        response = Response(f"An error occurred: {e}", status=500)
        set_cors_headers(response)
        return response