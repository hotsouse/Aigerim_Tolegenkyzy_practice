from fastapi import FastAPI,Depends,HTTPException
from .tasks import send_mock_email
from .auth import verify_token
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime,timedelta
from jose import jwt

app=FastAPI()

SECRET_KEY="aigerim"
ALGORITHM="HS256"
@app.post("/login")
def login(form_data:OAuth2PasswordRequestForm=Depends()):
    if form_data.username != "admin" or form_data.password != "admin":
        raise HTTPException(status_code=401,detail="Incorrect username or password")
    
    expire =datetime.utcnow() + timedelta(hours=1)
    payload={
        "sub": form_data.username,
        "exp":expire
    }
    token=jwt.encode(payload,SECRET_KEY,algorithm=ALGORITHM)
    return{"access_token":token,"token_type":"bearer"}





@app.post("/trigger-task")
def trigger_task(user=Depends(verify_token)):
    send_mock_email.delay("user@example.com")
    return {"meassage": "Task started"}