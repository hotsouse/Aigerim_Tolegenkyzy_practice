from typing import List
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from . import schemas, crud
from .database import engine, get_db
from .models import Base
from app import models


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.post("/notes/", response_model=schemas.NoteOut)
async def create_note(note: schemas.NoteCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_note(db=db, note=note)

@app.get("/notes/", response_model=List[schemas.NoteOut])
async def read_notes(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    notes = await crud.get_notes(db, skip=skip, limit=limit)
    return notes