#!/bin/bash

# Force unbuffered output for Python
export PYTHONUNBUFFERED=1

echo "🔍 Starting deployment on port ${PORT:-7860}..."
echo "📂 PYTHONPATH: $PYTHONPATH"

# Run worker from root using the package path
echo "🚀 Starting Celery worker..."
celery -A consumers.src.worker worker --loglevel=info &

# Wait a moment for background process to initialize
sleep 2

echo "🌐 Starting FastAPI producer..."
# Use exec to make uvicorn the main process (PID 1)
exec uvicorn producers.src.main:app --host 0.0.0.0 --port ${PORT:-7860} --log-level info
