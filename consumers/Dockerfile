FROM python:3.11-slim

# Create a non-root user
RUN useradd -m -u 1000 appuser
WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Pre-create Ultralytics config directory and set permissions
RUN mkdir -p /home/appuser/.config/Ultralytics && chown -R appuser:appuser /home/appuser/.config

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R appuser:appuser /app

USER appuser
ENV YOLO_CONFIG_DIR=/home/appuser/.config/Ultralytics

CMD ["celery", "-A", "src.worker", "worker", "--loglevel=info"]
