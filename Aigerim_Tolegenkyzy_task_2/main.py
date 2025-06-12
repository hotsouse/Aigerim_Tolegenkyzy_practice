from fastapi import FastAPI,Depends,HTTPException,status
from sqlmodel import Session,select
from models import User
from schemas import UserCreate,UserLogin
from database import create_db_and_tables,get_session

app=FastAPI()

@app.get("/")
def read_root():
    return {"message": "App is running!"}

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    
@app.post("/register")
def register(user_create:UserCreate,session:Session=Depends(get_session)):
    existing_user=session.exec(select(User).where(User.username==user_create.username)).first()
    if existing_user:
        raise HTTPException(status_code=400,detail="username already exists")
    
    user=User(username=user_create.username,password=user_create.password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"id": user.id,"username":user.username}

@app.post("/login")
def login(user_login:UserLogin,session:Session=Depends(get_session)):
    user=session.exec(select(User).where(User.username==user_login.username)).first()
    if not user:
        raise HTTPException(ststus_code=401,detail="Invaild username or password")
    if user.password !=user_login.password:
        raise HTTPException(status_code=401,detail="Invaild username or password")
    
    return{"message":"Login successful","username":user.username}