#!/bin/bash

# Force unbuffered output for Python
export PYTHONUNBUFFERED=1
export PYTHONPATH=$PYTHONPATH:/app

echo "🚀 Starting Celery worker in background..."
# Run worker from root using the package path
celery -A consumers.src.worker worker --loglevel=info &

echo "🌐 Starting FastAPI producer on port ${PORT:-7860}..."
# Use exec to make uvicorn the main process (PID 1)
# This helps with signal handling and ensures HF sees the process
exec uvicorn producers.src.main:app --host 0.0.0.0 --port ${PORT:-7860} --log-level info
