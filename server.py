import datetime
import json
from flask import Flask, request, jsonify, g, send_from_directory, session
from flask_cors import CORS, cross_origin
from google.cloud import storage, pubsub_v1
from google.api_core import exceptions
import os
import uuid
import hashlib
import logging
import time

# Configure logging to provide informative output
logging.basicConfig(level=logging.INFO)

# Function to hash passwords for secure storage
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# --- 1. Robust Database (In-memory simulation for demonstration purposes) ---
# In a production environment, this data would be in a real database.
products = [
    {"id": 1, "seller_id": "book-nook-seller", "name": "Atomic Habits", "price": 22.5, "image_url": "https://placehold.co/600x400/5f4b8b/fff?text=Atomic+Habits", "category": "Books", "store": "The Book Nook", "brand": "Avery", "description": "An easy & proven way to build good habits & break bad ones."},
    {"id": 2, "seller_id": "book-nook-seller", "name": "The Midnight Library", "price": 17.5, "image_url": "https://placehold.co/600x400/7a9e9f/fff?text=Midnight+Library", "category": "Books", "store": "The Book Nook", "brand": "Viking", "description": "A heartwarming and philosophical tale about life choices."},
    {"id": 3, "seller_id": "trendy-threads-seller", "name": "Elegant Evening Dress", "price": 89.99, "image_url": "https://placehold.co/600x400/a55447/fff?text=Elegant+Dress", "category": "Fashion", "store": "Trendy Threads", "brand": "Glamourous Attire", "description": "A stunning dress perfect for evening events. Made from high-quality silk blend."},
    {"id": 4, "seller_id": "tech-emporium-seller", "name": "Flagship Smartphone Pro", "price": 999.0, "image_url": "https://placehold.co/600x400/2f5d62/fff?text=Smartphone", "category": "Mobiles/Computers", "store": "Tech Emporium", "brand": "ApexTech", "description": "The latest flagship smartphone with a stunning display and pro-grade camera system."},
    {"id": 5, "seller_id": "active-zone-seller", "name": "Yoga Mat Premium", "price": 25.0, "image_url": "https://placehold.co/600x400/52b788/fff?text=Yoga+Mat", "category": "Sports", "store": "Active Zone", "brand": "ZenFlow", "description": "Durable and comfortable yoga mat for all your fitness needs."}
]

users = [
    {"id": 1, "email": "user@customer.com", "password": "password123", "username": "customer1", "role": "customer"},
    {"id": 999, "email": "admin@example.com", "password": hash_password("admin"), "username": "Admin", "role": "admin"},
    {"id": "book-nook-seller", "email": "thebooknook@gmail.com", "password": "thebooknook", "username": "The Book Nook", "role": "seller"},
    {"id": "trendy-threads-seller", "email": "trendythreads@gmail.com", "password": "trendythreads", "username": "Trendy Threads", "role": "seller"},
    {"id": "tech-emporium-seller", "email": "techemporium@gmail.com", "password": "techemporium", "username": "Tech Emporium", "role": "seller"},
    {"id": "active-zone-seller", "email": "activezone@gmail.com", "password": "activezone", "username": "Active Zone", "role": "seller"},
    {"id": 'general-promotions', "email": "promotions@example.com", "password": "promopass", "username": "General Promotions", "role": "seller"},
]

carts = []
reviews = []
messages = []
user_events = [
    {"event_type": "product_view", "data": {"user_id": 1, "product_id": 1, "timestamp": "2025-08-04T10:00:00"}},
    {"event_type": "product_view", "data": {"user_id": 1, "product_id": 3, "timestamp": "2025-08-04T10:02:00"}},
    {"event_type": "product_view", "data": {"user_id": 1, "product_id": 5, "timestamp": "2025-08-04T10:03:00"}},
]

# --- 2. Flask Setup ---
app = Flask(__name__, static_folder='frontend', static_url_path='/')
app.secret_key = os.environ.get('SECRET_KEY', 'a_secret_key_that_is_not_so_secret')
CORS(app)

# --- GCS setup ---
GCS_BUCKET_NAME = 'customersellerrelation'
GCS_PROJECT_ID = 'svaraflow'

GCS_MOCK_MODE = False
gcs_client = None
gcs_bucket = None
gcs_client_ok = False

if not GCS_MOCK_MODE:
    try:
        from google.cloud import storage
        gcs_client = storage.Client(project=GCS_PROJECT_ID)
        gcs_bucket = gcs_client.bucket(GCS_BUCKET_NAME)
        gcs_client_ok = True
        logging.info(f"Google Cloud Storage client initialized successfully for bucket '{GCS_BUCKET_NAME}'.")
    except Exception as e:
        logging.error(f"Failed to initialize GCS client: {e}")
        logging.warning("Please ensure your GOOGLE_APPLICATION_CREDENTIALS environment variable is set correctly.")
else:
    logging.info("Running in GCS mock mode. No real GCS operations will be performed.")

# Pub/Sub setup
PUBSUB_TOPIC_ID = 'seller-notifications-topic'
PUBSUB_SUBSCRIPTION_ID = 'seller-notifications-subscription'
pubsub_publisher = pubsub_v1.PublisherClient()
pubsub_publisher_path = pubsub_publisher.topic_path(GCS_PROJECT_ID, PUBSUB_TOPIC_ID)
pubsub_subscriber = pubsub_v1.SubscriberClient()
pubsub_subscription_path = pubsub_subscriber.subscription_path(GCS_PROJECT_ID, PUBSUB_SUBSCRIPTION_ID)


def upload_blob(file_stream, destination_blob_name):
    if not gcs_client_ok:
        logging.warning("GCS client is not configured. File upload skipped.")
        return f"https://via.placeholder.co/400x300/f8f9fa?text=GCS+Error"
    
    try:
        blob = gcs_bucket.blob(destination_blob_name)
        file_stream.seek(0)
        blob.upload_from_file(file_stream, content_type=file_stream.content_type)
        logging.info(f"File uploaded successfully to {destination_blob_name}.")
        return blob.public_url
    except Exception as e:
        logging.error(f"Error uploading file to GCS: {e}")
        return None

def save_user_event(user_id, event_type, event_data):
    if not user_id:
        return
    event_data['user_id'] = user_id
    event_data['timestamp'] = datetime.datetime.now().isoformat()
    user_events.append({"event_type": event_type, "data": event_data})

# --- 3. Frontend Routes to serve HTML, CSS, and JS files ---
@app.route('/')
def home():
    return send_from_directory('frontend', 'login.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('frontend', filename)


# --- 4. API Routes ---
def require_auth(role=None):
    if "user_id" not in session:
        return False
    
    g.user_id = session.get("user_id")
    if role:
        user = next((u for u in users if str(u['id']) == str(g.user_id)), None)
        if user and user['role'] == role:
            return True
        return False
    return True

@app.before_request
def mock_auth():
    g.user_id = session.get('user_id')
    g.role = session.get('role')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    
    user = next((u for u in users if u['email'] == email), None)

    if user and user['role'] == role:
        is_authenticated = False
        if user['role'] == 'admin':
            if hash_password(password) == user['password']:
                is_authenticated = True
        else:
            if password == user['password']:
                is_authenticated = True

        if is_authenticated:
            session["user_id"] = user['id']
            session["role"] = user['role']
            response = jsonify({"success": True, "message": "Login successful!", "user": {"id": user['id'], "email": user['email'], "role": user['role'], "username": user['username']}})
            save_user_event(user['id'], 'login', {"email": user['email'], "source": "manual_login"})
            return response
        else:
            return jsonify({"success": False, "message": "Invalid password."}), 401
    else:
        return jsonify({"success": False, "message": "Invalid credentials or role mismatch."}), 401

@app.route('/api/admin/signup', methods=['POST'])
def admin_signup():
    global users
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"success": False, "message": "Email and password are required."}), 400

    if any(u['email'] == email for u in users):
        return jsonify({"success": False, "message": "An account with this email already exists."}), 409

    new_admin_id = str(uuid.uuid4())
    new_admin_user = {
        "id": new_admin_id,
        "email": email,
        "password": hash_password(password),
        "username": "Admin",
        "role": "admin"
    }
    users.append(new_admin_user)
    
    session["user_id"] = new_admin_id
    session["role"] = "admin"

    return jsonify({"success": True, "message": "Admin account created and logged in.", "user": {"id": new_admin_id, "email": email, "role": "admin"}})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully."})

@app.route('/api/current_user', methods=['GET'])
def get_current_user():
    if "user_id" in session:
        user_id = session["user_id"]
        user = next((u for u in users if str(u['id']) == str(user_id)), None)
        if user:
            return jsonify({"success": True, "user": {"id": user['id'], "role": user['role'], "username": user['username']}})
    return jsonify({"success": False, "message": "No user is logged in."}), 401

@app.route('/api/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    role = data.get('role')

    if role == 'customer':
        user = next((u for u in users if u['role'] == 'customer'), None)
    elif role == 'seller':
        user = next((u for u in users if u['role'] == 'admin'), None)
    else:
        return jsonify({"success": False, "message": "Invalid role."}), 401

    if user:
        session["user_id"] = user['id']
        session["role"] = user['role']
        response = jsonify({"success": True, "message": "Google login successful!", "user": {"id": user['id'], "email": user['email'], "role": user['role'], "username": user['username']}})
        save_user_event(user['id'], 'google_login', {"email": user['email'], "token": data.get('token')})
        return response
    else:
        return jsonify({"success": False, "message": "Login failed or no user found for that role."}), 401

@app.route('/api/products', methods=['GET'])
def get_products():
    if not gcs_client_ok:
        return jsonify({"success": True, "products": products})

    try:
        all_products_from_gcs = []
        blobs = gcs_client.list_blobs(GCS_BUCKET_NAME, prefix='seller_uploads/metadata/')

        for blob in blobs:
            if blob.name.endswith('.json'):
                product_data = json.loads(blob.download_as_text())
                all_products_from_gcs.append(product_data)

        return jsonify({"success": True, "products": all_products_from_gcs})
    except Exception as e:
        logging.error(f"Error fetching products from GCS: {e}")
        return jsonify({"success": False, "message": "Failed to fetch all products. Check GCS bucket and permissions."}), 500

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    product = next((p for p in products if str(p['id']) == str(product_id)), None)

    if not product:
        return jsonify({"message": "Product not found."}), 404

    user_id = session.get('user_id', 'anonymous')
    customer = next((u for u in users if str(u['id']) == str(user_id)), None)
    seller = next((u for u in users if str(u['id']) == str(product['seller_id'])), None)

    if customer and seller:
        new_message = {
            "id": str(uuid.uuid4()),
            "sender_id": 'system',
            "seller_id": seller['id'],
            "content": f"Customer {customer['username']} (Email: {customer['email']}) is viewing your product: {product['name']}.",
            "product_id": product_id,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        try:
            pubsub_publisher.publish(pubsub_publisher_path, json.dumps(new_message).encode("utf-8"))
            logging.info(f"Published notification for seller {seller['username']}.")
        except Exception as e:
            logging.error(f"Failed to publish to Pub/Sub: {e}")
            
    return jsonify(product)

@app.route('/api/seller/products', methods=['GET'])
def get_seller_products():
    if not require_auth(role="seller"):
        return jsonify({"success": False, "message": "Seller authentication required."}), 401

    seller_products = [p for p in products if str(p['seller_id']) == str(g.user_id)]

    return jsonify({"success": True, "products": seller_products})

@app.route('/api/seller/upload_product', methods=['POST'])
def upload_product():
    if not require_auth(role="seller"):
        return jsonify({"success": False, "message": "Seller authentication required."}), 401

    name = request.form.get('name')
    description = request.form.get('description')
    price = request.form.get('price')
    image_file = request.files.get('image')

    if not all([name, description, price, image_file]):
        return jsonify({"success": False, "message": "Missing product data or image."}), 400

    seller = next((u for u in users if str(u['id']) == str(g.user_id)), None)
    if not seller:
        return jsonify({"success": False, "message": "Seller not found."}), 404

    new_product_id = str(uuid.uuid4()) 

    image_filename = f"{uuid.uuid4()}_{image_file.filename}"
    image_path = f"seller_uploads/{seller['email']}/images/{image_filename}"

    public_url = upload_blob(image_file, image_path)
    if not public_url:
        return jsonify({"success": False, "message": "File upload failed. Check server logs."}), 500

    new_product = {
        "id": new_product_id,
        "seller_id": g.user_id,
        "name": name,
        "description": description,
        "price": float(price),
        "image_url": public_url
    }

    products.append(new_product)

    product_data_filename = f"product_{new_product_id}.json"
    product_data_path = f"seller_uploads/{seller['email']}/metadata/{product_data_filename}"

    if gcs_client_ok:
        try:
            blob = gcs_bucket.blob(product_data_path)
            blob.upload_from_string(json.dumps(new_product, indent=2), content_type='application/json')
            logging.info(f"Product metadata uploaded to {product_data_path}")
        except Exception as e:
            logging.warning(f"Warning: Failed to upload product metadata to GCS: {e}")

    save_user_event(g.user_id, 'product_upload', new_product)

    return jsonify({"success": True, "message": "Product uploaded successfully.", "product": new_product})

@app.route('/api/seller/analytics', methods=['GET'])
def get_seller_analytics():
    if not require_auth(role="seller"):
        return jsonify({"success": False, "message": "Seller authentication required."}), 401

    seller_products_ids = [p['id'] for p in products if str(p['seller_id']) == str(g.user_id)]

    analytics = {}
    for event in user_events:
        if event['event_type'] == 'product_view' and str(event['data']['product_id']) in [str(pid) for pid in seller_products_ids]:
            product_id = str(event['data']['product_id'])
            user_id = event['data']['user_id']

            if product_id not in analytics:
                analytics[product_id] = {}
            if user_id not in analytics[product_id]:
                analytics[product_id][user_id] = {"views": 0, "total_time": 0}
            analytics[product_id][user_id]["views"] += 1

    return jsonify({"success": True, "data": analytics})

@app.route('/api/seller/messages', methods=['GET'])
def get_seller_messages():
    if not require_auth(role="seller"):
        return jsonify({"success": False, "message": "Seller authentication required."}), 401
    
    return jsonify({"success": True, "messages": messages})

@app.route('/api/seller/notifications/poll', methods=['GET'])
@cross_origin(origins=['https://auramart-prototype-32681899180.asia-south1.run.app'])
def poll_notifications():
    """
    Polls for new notifications from a Pub/Sub subscription and returns them.
    This replaces the SSE stream.
    """
    user_id = request.args.get('sellerId')
    if not user_id:
        return jsonify({"success": False, "message": "Authentication required."}), 401

    messages_to_return = []
    ack_ids = []

    try:
        response = pubsub_subscriber.pull(
            request={'subscription': pubsub_subscription_path, 'max_messages': 10, 'return_immediately': True}
        )

        for received_message in response.received_messages:
            ack_ids.append(received_message.ack_id)
            try:
                message_data = json.loads(received_message.message.data.decode('utf-8'))
                if str(message_data.get('seller_id')) == str(user_id):
                    messages_to_return.append(message_data)
                else:
                    logging.warning(f"Received message for a different seller ({message_data.get('seller_id')}). Acknowledging.")
            except Exception as e:
                logging.error(f"Error processing Pub/Sub message: {e}")

        if ack_ids:
            pubsub_subscriber.acknowledge(
                request={'subscription': pubsub_subscription_path, 'ack_ids': ack_ids}
            )

    except exceptions.ClientError as e:
        logging.error(f"Pub/Sub client error during pull: {e}")
        return jsonify({"success": False, "message": "Failed to retrieve notifications."}), 500
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        return jsonify({"success": False, "message": "An unexpected error occurred."}), 500
    
    return jsonify({"success": True, "notifications": messages_to_return})


@app.route('/api/admin/seller_accounts', methods=['GET'])
def get_admin_seller_accounts():
    if not require_auth(role="admin"):
        return jsonify({"success": False, "message": "Admin authentication required."}), 401
        
    seller_accounts = [{"id": u['id'], "username": u['username']} for u in users if u['role'] == 'seller']
    
    return jsonify({"success": True, "sellers": seller_accounts})

@app.route('/api/admin/select_seller', methods=['POST'])
def select_seller_account():
    data = request.get_json()
    seller_id = data.get('seller_id')
    
    if not require_auth(role="admin"):
        return jsonify({"success": False, "message": "Admin authentication required."}), 401

    seller = next((u for u in users if str(u['id']) == str(seller_id) and u['role'] == 'seller'), None)
    
    if seller:
        session["user_id"] = seller['id']
        session["role"] = "seller"
        logging.info(f"Admin switched to seller: {seller['username']} (ID: {seller['id']}).")
        return jsonify({"success": True, "message": f"Successfully switched to seller: {seller['username']}."})
    else:
        return jsonify({"success": False, "message": "Seller not found or invalid ID."}), 404

@app.route('/api/admin/remove_product', methods=['DELETE'])
def remove_product():
    global products
    if not require_auth(role="admin"):
        return jsonify({"success": False, "message": "Admin authentication required."}), 401

    data = request.get_json()
    product_id = data.get('product_id')
    
    initial_product_count = len(products)
    products = [p for p in products if str(p['id']) != str(product_id)]

    if len(products) < initial_product_count:
        logging.info(f"Product with ID {product_id} removed by admin.")
        return jsonify({"success": True, "message": f"Product with ID {product_id} removed."})
    else:
        return jsonify({"success": False, "message": "Product not found."}), 404

if __name__ == '__main__':
    app.run(debug=True, port=os.environ.get("PORT", 5000))