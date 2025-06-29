import uuid
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- models ----------
class TodoItem(BaseModel):
    id: str
    task: str
    completed: bool = False

class TodoCreate(BaseModel):
    task: str

class TodoRename(BaseModel):
    task: str

class TodoToggle(BaseModel):
    completed: bool

fake_db: List[TodoItem] = []

# ---------- API ----------
@app.get("/api/todos", response_model=List[TodoItem])
async def get_todos():
    return fake_db

@app.post("/api/todos", response_model=TodoItem, status_code=201)
async def add_todo(payload: TodoCreate):
    todo = TodoItem(id=str(uuid.uuid4()), task=payload.task)
    fake_db.append(todo)
    return todo

@app.patch("/api/todos/{todo_id}", response_model=TodoItem)
async def toggle_todo(todo_id: str, payload: TodoToggle):
    for t in fake_db:
        if t.id == todo_id:
            t.completed = payload.completed
            return t
    raise HTTPException(404)

# ---- ⬇ СТАВИМ ПЕРВЫМ статический путь ----------------
@app.delete("/api/todos/completed", status_code=204)
async def clear_completed():
    global fake_db
    fake_db = [t for t in fake_db if not t.completed]
# -------------------------------------------------------

@app.put("/api/todos/{todo_id}", response_model=TodoItem)
async def rename(todo_id: str, payload: TodoRename):
    for t in fake_db:
        if t.id == todo_id:
            t.task = payload.task
            return t
    raise HTTPException(404)

@app.delete("/api/todos/{todo_id}", status_code=204)
async def delete(todo_id: str):
    global fake_db
    fake_db = [t for t in fake_db if t.id != todo_id]

@app.get("/")
async def root():
    return {"message": "backend ok"}
