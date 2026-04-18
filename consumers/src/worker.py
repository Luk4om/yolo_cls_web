import os
import time
from celery import Celery
from ultralytics import YOLO
from dotenv import load_dotenv

load_dotenv()

# Celery Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
app = Celery("worker", broker=REDIS_URL, backend=REDIS_URL)

# Model configuration
MODEL_PATH = os.getenv("MODEL_PATH", "yolo26n-cls.onnx")

# Load model once at startup
print(f"Loading model from {MODEL_PATH}...")
model = YOLO(MODEL_PATH)

@app.task(name="worker.classify_image")
def classify_image(image_path: str):
    print(f"Processing image: {image_path}")
    try:
        # Run inference
        results = model.predict(image_path)
        
        # Parse results (Classification)
        # top5 are the class indices and names
        top1_name = results[0].names[results[0].probs.top1]
        top1_conf = float(results[0].probs.top1conf)
        
        probs = results[0].probs.data.tolist()
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
    finally:
        # Clean up image? Or keep it?
        # For this demo, let's keep it but ideally we'd delete it or move to permanent storage
        pass

if __name__ == "__main__":
    app.start()
