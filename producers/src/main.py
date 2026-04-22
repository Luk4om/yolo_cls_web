import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from celery import Celery
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="YOLO AI Producer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Celery Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.update(
    broker_use_ssl={"ssl_cert_reqs": "none"},
    redis_backend_use_ssl={"ssl_cert_reqs": "none"}
)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "data")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class TaskResponse(BaseModel):
    task_id: str
    status: str

import base64

@app.post("/upload", response_model=TaskResponse)
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{ext}")
    
    # Read file content
    content = await file.read()
    
    # Save locally (Optional, for logging)
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Encode to Base64 for cross-space compatibility
    base64_image = base64.b64encode(content).decode('utf-8')
    
    # Trigger Celery Task with Base64 data
    task = celery_app.send_task("worker.classify_image", args=[base64_image])
    
    return {"task_id": task.id, "status": "PENDING"}

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    res = celery_app.AsyncResult(task_id)
    if res.ready():
        return {"status": "SUCCESS", "result": res.result}
    return {"status": res.status}

# Mount the static files from the 'web/out' directory
# This allows the API to serve the frontend in environments like HF Spaces
if os.path.exists("/app/web/out"):
    app.mount("/", StaticFiles(directory="/app/web/out", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
