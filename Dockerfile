# Stage 1: Build the frontend
FROM node:20-slim AS frontend-builder
WORKDIR /web
COPY web/package*.json ./
RUN npm install
COPY web/ ./
# Set the API URL to relative for the same-origin deployment
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# Stage 2: Python Backend & Final Image
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for Hugging Face Spaces (UID 1000)
RUN useradd -m -u 1000 appuser

# Copy requirements and install
COPY producers/requirements.txt ./producers-reqs.txt
COPY consumers/requirements.txt ./consumers-reqs.txt
RUN pip install --no-cache-dir -r producers-reqs.txt -r consumers-reqs.txt
# Ensure onnx is installed
RUN pip install --no-cache-dir onnx

# Copy the apps
COPY producers/ ./producers
COPY consumers/ ./consumers
COPY --from=frontend-builder /web/out ./web/out

# Pre-create Ultralytics config directory and set permissions
RUN mkdir -p /home/appuser/.config/Ultralytics && chown -R appuser:appuser /home/appuser/.config

# Set ownership
RUN chown -R appuser:appuser /app

USER appuser
ENV HOME=/home/appuser
ENV PATH="/home/appuser/.local/bin:${PATH}"
ENV YOLO_CONFIG_DIR=/home/appuser/.config/Ultralytics
ENV PYTHONPATH=/app/producers:/app/consumers

# Start script
COPY start.sh .
# The start script will be made executable during creation or here
# RUN chmod +x start.sh 

CMD ["/bin/bash", "start.sh"]
