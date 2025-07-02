import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List

import aiofiles
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

# --- Файл БД ---
BASE_DIR = Path(__file__).resolve().parent            # абсолютный путь к папке backend
DB_FILE = BASE_DIR / "data" / "guestbook.json"

# создаём папку и пустой файл [] при первом запуске
DB_FILE.parent.mkdir(parents=True, exist_ok=True)
if not DB_FILE.exists():
    DB_FILE.write_text("[]", encoding="utf-8")

# ---------- Pydantic модели ----------
class GuestbookEntry(BaseModel):
    id: str
    name: str
    message: str
    timestamp: datetime

class EntryCreate(BaseModel):
    name: str
    message: str

class EntryUpdate(BaseModel):
    message: str

# ---------- Работа с JSON ----------
async def read_db() -> List[GuestbookEntry]:
    async with aiofiles.open(DB_FILE, "r", encoding="utf-8") as f:
        raw = await f.read()
    if not raw:
        return []
    data = json.loads(raw)
    return [GuestbookEntry(**item) for item in data]

async def write_db(entries: List[GuestbookEntry]) -> None:
    export = [e.model_dump(mode="json") for e in entries]
    async with aiofiles.open(DB_FILE, "w", encoding="utf-8") as f:
        await f.write(json.dumps(export, indent=4, ensure_ascii=False))

# ---------- Эндпоинты ----------
@app.get("/api/entries", response_model=List[GuestbookEntry])
async def get_entries(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    """Список записей c пагинацией: ?page=1&limit=10"""
    entries = await read_db()
    entries.sort(key=lambda e: e.timestamp, reverse=True)
    start = (page - 1) * limit
    end = start + limit
    return entries[start:end]

@app.post("/api/entries", response_model=GuestbookEntry, status_code=201)
async def create_entry(payload: EntryCreate):
    entries = await read_db()
    entry = GuestbookEntry(
        id=str(uuid.uuid4()),
        name=payload.name,
        message=payload.message,
        timestamp=datetime.now(timezone.utc),
    )
    entries.append(entry)
    await write_db(entries)
    return entry

@app.put("/api/entries/{entry_id}", response_model=GuestbookEntry)
async def update_entry(entry_id: str, payload: EntryUpdate):
    entries = await read_db()
    for i, e in enumerate(entries):
        if e.id == entry_id:
            updated = e.copy(update={"message": payload.message})
            entries[i] = updated
            await write_db(entries)
            return updated
    raise HTTPException(status_code=404, detail="Запись не найдена")

@app.delete("/api/entries/{entry_id}", status_code=204)
async def delete_entry(entry_id: str):
    entries = await read_db()
    new_entries = [e for e in entries if e.id != entry_id]
    if len(new_entries) == len(entries):
        raise HTTPException(status_code=404, detail="Запись не найдена")
    await write_db(new_entries)
