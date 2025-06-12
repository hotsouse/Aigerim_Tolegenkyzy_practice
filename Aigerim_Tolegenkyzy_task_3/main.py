from fastapi import FastAPI, HTTPException
from sqlmodel import SQLModel, Session, create_engine, select
from models import User
from schemas import UserCreate,UserLogin
from auth import get_password_hash,verify_password


DATABASE_URL="postgresql://ajger2:aigerim@localhost/ajger2"
engine= create_engine(DATABASE_URL)

app=FastAPI()

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    
@app.post("/register")
def register(user:UserCreate):
    with Session(engine) as session:
        existing=session.exec(select(User).where(User.username==user.username)).first()
        if existing:
            raise HTTPException(status_code=400,detail="username already registered")
        
        hashed_password=get_password_hash(user.password)
        db_user=User(username=user.username,hashed_password=hashed_password)
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return{"msg": "User registered successfully"}
    
@app.post("/login")
def login(user:UserLogin):
    with Session(engine) as session:
        db_user=session.exec(select(User).where(User.username==user.username)).first()
        if not db_user or not verify_password(user.password,db_user.hashed_password):
            raise HTTPException(status_code=401,detail="Invalid credentials")
        return {"msg": "Login successful"}
            
        
