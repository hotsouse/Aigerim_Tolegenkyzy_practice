from fastapi import FastAPI
from sqlmodel import SQLModel
from app.database import engine
from app.routers import register, login, admin

app = FastAPI()

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

app.include_router(register.router)
app.include_router(login.router)
app.include_router(admin.router)
