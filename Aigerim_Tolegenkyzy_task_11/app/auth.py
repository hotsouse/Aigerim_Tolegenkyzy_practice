from fastapi import Depends,HTTPException
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from jose import jwt

security = HTTPBearer()
SECRET_KEY="aigerim"

def verify_token(credentials:HTTPAuthorizationCredentials=Depends(security)):
    token=credentials.credentials
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms=["HS256"])
        return payload
    except Exception:
        raise HTTPexception(status_code=403,detail="Invalid token")

