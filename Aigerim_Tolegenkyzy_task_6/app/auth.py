from fastapi import Depends,HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError,jwt
from sqlmodel import Session,select
from .database import get_session
from .models import User

SECRET_KEY="aigerim"
ALGORITHM="HS256"

oauth2_scheme=OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token:str=Depends(oauth2_scheme),session:Session=Depends(get_session)) -> User:
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        username=payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401,detail="Invalid token")
        user=session.exec(select(User).where(User.username==username)).first()
        if user is None:
            raise HTTPException(status_code=401,detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=403,detail="Couldn't validate credentials")
    
    