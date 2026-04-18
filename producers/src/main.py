import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "data")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class TaskResponse(BaseModel):
    task_id: str
    status: str

@app.post("/upload", response_model=TaskResponse)
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{ext}")
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Trigger Celery Task
    task = celery_app.send_task("worker.classify_image", args=[file_path])
    
    return {"task_id": task.id, "status": "PENDING"}

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    res = celery_app.AsyncResult(task_id)
    if res.ready():
        return {"status": "SUCCESS", "result": res.result}
    return {"status": res.status}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
