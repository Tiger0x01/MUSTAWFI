import uuid
import os
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def validate_and_save_image(file: UploadFile) -> str:
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, PNG, and WEBP are supported.")
    
    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10 MB.")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
        
    file.file.seek(0) 
    
    app_id = f"mst-{uuid.uuid4().hex[:8]}"
    file_path = os.path.join(UPLOAD_DIR, f"{app_id}.{ext}")
    
    with open(file_path, "wb") as f:
        f.write(contents)
        
    return app_id

def get_image_path(app_id: str) -> str:
    for ext in ALLOWED_EXTENSIONS:
        path = os.path.join(UPLOAD_DIR, f"{app_id}.{ext}")
        if os.path.exists(path):
            return path
    raise HTTPException(status_code=404, detail="Application image not found.")