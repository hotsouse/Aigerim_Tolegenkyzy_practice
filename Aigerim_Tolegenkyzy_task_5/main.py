from fastapi import FastAPI,Depends
from auth import login,read_users_me,get_current_user
from models import User

app=FastAPI()
app.post("/login")(login)
app.get("/users/me",response_model=User)(read_users_me)