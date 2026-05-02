from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/")
@app.get("/health")
def health():
    return {"status": "ok", "service": "consumer-worker"}
