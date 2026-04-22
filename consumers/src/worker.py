import os
import time
from celery import Celery
from ultralytics import YOLO
from dotenv import load_dotenv

load_dotenv()

# Celery Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
app = Celery("worker", broker=REDIS_URL, backend=REDIS_URL)
app.conf.update(
    broker_use_ssl={"ssl_cert_reqs": "none"},
    redis_backend_use_ssl={"ssl_cert_reqs": "none"}
)

# Model configuration
MODEL_PATH = os.getenv("MODEL_PATH", "yolo26n-cls.onnx")

# Load model once at startup
print(f"Loading model from {MODEL_PATH}...")
model = YOLO(MODEL_PATH)

import base64
import io
from PIL import Image

@app.task(name="worker.classify_image")
def classify_image(base64_data: str):
    print("Received task: Processing base64 image data")
    try:
        # Decode base64 to image
        img_bytes = base64.b64decode(base64_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        
        # Run inference (YOLO can take PIL images directly)
        results = model.predict(img)
        
        # Parse results
        top1_name = results[0].names[results[0].probs.top1]
        top1_conf = float(results[0].probs.top1conf)
        
        top5_indices = results[0].probs.top5
        predictions = []
        for idx in top5_indices:
            predictions.append({
                "label": results[0].names[idx],
                "confidence": float(results[0].probs.data[idx])
            })

        return {
            "top1": top1_name,
            "confidence": top1_conf,
            "predictions": predictions
        }
    except Exception as e:
        print(f"Error processing image: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    app.start()
