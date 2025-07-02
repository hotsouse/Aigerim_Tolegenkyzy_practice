import os
import uuid
import aiofiles
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()

# --- CORS ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Путь для сохранения изображений ---
IMAGE_DIR = "static/images/"
MAX_FILE_SIZE = 5 * 1024 * 1024          # 5 МБ

os.makedirs(IMAGE_DIR, exist_ok=True)

# --- Раздача статических файлов ---
app.mount("/static", StaticFiles(directory="static"), name="static")


# ---------- Загрузка ----------
@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    # Тип
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image.")

    # Имя
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no filename.")

    # Считаем всё в память (для учебного проекта приемлемо)
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File is larger than 5 MB.")

    # Уникальное имя
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(IMAGE_DIR, unique_filename)

    # Асинхронно пишем
    try:
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {e}")

    return {"url": f"/static/images/{unique_filename}"}


# ---------- Список ----------
@app.get("/api/images", response_model=List[str])
async def get_images():
    try:
        images = [
            f"/static/images/{img}"
            for img in os.listdir(IMAGE_DIR)
            if os.path.isfile(os.path.join(IMAGE_DIR, img))
        ]
        return images
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading image directory: {e}")


# ---------- Удаление ----------
@app.delete("/api/images/{filename}", status_code=204)
async def delete_image(filename: str):
    # базовая защита от path‑traversal
    if "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Bad filename.")

    path = os.path.join(IMAGE_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found.")

    try:
        os.remove(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {e}")
