from sqlmodel import Session,select
from models import User
from auth import get_password_hash
from main import engine

with Session(engine) as session:
    users=session.exec(select(User)).all()
    for user in users:
        if not user.hashed_password.startwith("$2b$"):
            user.hashed_password=get_password_hash(user.hashed_password)
            session.add(user)
session.commit()        
