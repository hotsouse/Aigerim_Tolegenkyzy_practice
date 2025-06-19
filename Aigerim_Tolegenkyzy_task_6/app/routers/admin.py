from fastapi import APIRouter,Depends 
from sqlmodel import Session,select
from ..models import User
from ..database import get_session
from ..dependencies import require_role

router=APIRouter()

@router.get("/admin/users")
def get_all_users(session:Session=Depends(get_session),user=Depends(require_role("admin"))):
    users=session.exec(select(User)).all()
    return users