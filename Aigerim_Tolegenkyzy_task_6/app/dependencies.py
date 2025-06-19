from fastapi import Depends,HTTPException,status
from .auth import get_current_user
from .models import User

def require_role(required_role:str):
    def role_dependency(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden"
            )
        return current_user
    return role_dependency
    