# Use the official Python image as a base
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install Python dependencies
# This step is cached, so subsequent builds are faster if dependencies don't change
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
# This includes server.py, notification_worker.py, and the entire frontend directory
COPY . .

# Expose the port that the application listens on. Cloud Run requires port 8080.
EXPOSE 8080

# The command to start the web server
# gunicorn is a production-grade WSGI server
# The --bind 0.0.0.0:8080 is crucial for Cloud Run to route traffic correctly
# server:app refers to the 'app' object in the 'server.py' file
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "server:app"]

# Note: The `notification_worker.py` is designed as a separate, long-running service.
# Cloud Run is designed for stateless, short-lived requests. For a production
# environment, you would typically deploy the notification worker as a separate
# Cloud Run service that is triggered by Pub/Sub, or use a Google Compute Engine
# VM to run it as a persistent process. This Dockerfile is for the main server only.