#!/bin/bash

# Start the Celery worker in the background
echo "Starting Celery worker..."
cd /app/consumers && celery -A src.worker worker --loglevel=info &

# Start the FastAPI producer in the foreground
echo "Starting FastAPI producer..."
cd /app/producers && python src/main.py
