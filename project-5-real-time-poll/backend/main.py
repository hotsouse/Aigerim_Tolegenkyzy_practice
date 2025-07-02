# backend/main.py
from typing import List, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import Poll, PollOption
from .storage import load_polls, save_polls
from pydantic import BaseModel, constr

# --------------------------------------------------
app = FastAPI()

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Хранилище в ОЗУ ----------
polls: List[Poll] = []


# ---------- Pydantic‑схема входного JSON ----------
class PollCreate(BaseModel):
    question: constr(strip_whitespace=True, min_length=1)
    options: List[constr(strip_whitespace=True, min_length=1)]


# ---------- Загрузка данных при старте ----------
@app.on_event("startup")
async def startup() -> None:
    global polls
    polls = [Poll(**p) for p in await load_polls()]


# ---------- API ----------

@app.get("/api/poll", response_model=List[Poll])
async def list_polls():
    """Список всех опросов (без голосования)."""
    return polls


@app.get("/api/poll/{poll_id}", response_model=Poll)
async def get_poll(poll_id: int):
    """Получить конкретный опрос по ID."""
    for p in polls:
        if p.id == poll_id:
            return p
    raise HTTPException(404, "Poll not found")


@app.post("/api/poll/create", status_code=201)
async def create_poll(data: PollCreate):
    """Создать новый опрос."""
    new_id = (max(p.id for p in polls) + 1) if polls else 1
    poll = Poll(
        id=new_id,
        question=data.question,
        options=[PollOption(id=i, text=txt) for i, txt in enumerate(data.options, 1)],
    )
    polls.append(poll)
    await save_polls([p.dict() for p in polls])
    return {"id": new_id}


@app.post("/api/poll/{poll_id}/vote")
async def vote(poll_id: int, payload: Dict):
    """Отдать голос за вариант с option_id."""
    option_id = payload.get("option_id")
    if option_id is None:
        raise HTTPException(400, "option_id is required")

    for p in polls:
        if p.id == poll_id:
            for opt in p.options:
                if opt.id == option_id:
                    opt.votes += 1
                    await save_polls([p.dict() for p in polls])
                    return {"ok": True}
            raise HTTPException(404, "Option not found")
    raise HTTPException(404, "Poll not found")
