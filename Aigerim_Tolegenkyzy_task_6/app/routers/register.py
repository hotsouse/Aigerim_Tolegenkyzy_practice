from fastapi import APIRouter,Depends,HTTPException
from sqlmodel import Session
from ..models import User
from ..schemas import UserCreate
from ..database import get_session
from passlib.hash import bcrypt

router = APIRouter()

@router.post("/register")
def register(user:UserCreate,session:Session=Depends(get_session)):
    hashed_password=bcrypt.hash(user.password)
    db_user=User(username=user.username,password=hashed_password)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return{"message":"User created"}
