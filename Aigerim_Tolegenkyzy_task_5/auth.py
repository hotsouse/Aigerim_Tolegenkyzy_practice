from fastapi import Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from jose import JWTError,jwt
from pydantic import BaseModel
from datetime import datetime,timedelta
from typing import Optional
from models import User,Token

SECRET_KEY="aigerim"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

oauth2_scheme=OAuth2PasswordBearer(tokenUrl="login")

fake_users_db={
    "alice":{"id":1,"username":"alice", "password": "testpassword"},
    "ayan":{"id":2, "username":"ayan","password":"qwert"},
}

class TokenData(BaseModel):
    username:Optional[str]=None
    
    
def create_acces_token(data:dict,expires_delta:timedelta):
    to_encode=data.copy()
    expire=datetime.utcnow() + expires_delta
    to_encode.update({"exp":expire})
    return jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)


def verify_token(token:str):
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        username:str=payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid token payload")
        return TokenData(username=username)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid  token")
    
 
async def get_current_user(token:str=Depends(oauth2_scheme)) -> User:
     token_data=verify_token(token)
     user_dict=fake_users_db.get(token_data.username) 
     if user_dict is None:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="User not found")
     return User(**user_dict)
    
async def login(form_data:OAuth2PasswordRequestForm=Depends()):
    user_dict=fake_users_db.get(form_data.username)
    if not user_dict or user_dict["password"] != form_data.password:
        raise HTTPException(status_code=400,detail="Incorrect username or password")
    access_token=create_acces_token(
        data={"sub": form_data.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"acces_token": access_token, "token_type": "bearer"}

async def read_users_me(current_user:User=Depends(get_current_user)):
    return current_user