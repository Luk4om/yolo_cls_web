#!/bin/bash

# Export paths so modules can find each other
export PYTHONPATH=$PYTHONPATH:/app/producers:/app/consumers

echo "🚀 Starting Celery worker..."
celery -A consumers.src.worker worker --loglevel=info &

echo "🌐 Starting FastAPI producer on port ${PORT:-7860}..."
# Running uvicorn directly ensures it binds to the correct port for HF Spaces
python -m uvicorn producers.src.main:app --host 0.0.0.0 --port ${PORT:-7860}
