from fastapi import APIRouter,Depends,HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from ..database import get_session
from ..models import User
from sqlmodel import Session,select
from passlib.hash import bcrypt
from jose import jwt 

from ..auth import SECRET_KEY,ALGORITHM

router=APIRouter()

@router.post("/login")
def login(form_data:OAuth2PasswordRequestForm=Depends(),session:Session=Depends(get_session)):
    user=session.exec(select(User).where(User.username==form_data.username)).first()
    if not user or not bcrypt.verify(form_data.password,user.password):
        raise HTTPException(status_code=400,detail="Incorrect username or password")
    
    token_data={"sub":user.username}
    token=jwt.encode(token_data,SECRET_KEY,algorithm=ALGORITHM)
    return{"access_token":token,"token_type":"bearer"}