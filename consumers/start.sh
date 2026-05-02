#!/bin/bash
export PYTHONUNBUFFERED=1
echo "🚀 Starting Consumer Worker and Health Check..."
# Start health check on 7860
uvicorn health:app --host 0.0.0.0 --port 7860 &
# Start worker
exec celery -A src.worker worker --loglevel=info
