from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models,schemas
async def create_note(db:AsyncSession, note:schemas.NoteCreate):
    db_note=models.Note(text=note.text)
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note
async def get_notes(db:AsyncSession,skip:int=0,limit:int=100):
    result=await db.execute(select(models.Note).offset(skip).limit(limit))
    return result.scalars().all()
