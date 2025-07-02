from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Annotated, Dict
import uuid, datetime

app = FastAPI()

# --- CORS ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Фейковые пользователи с ролями ---
FAKE_USERS_DB: Dict[str, Dict] = {
    "admin": {"username": "admin", "password": "admin123", "role": "admin"},
    "user":  {"username": "user",  "password": "password",  "role": "user"},
}

# --- «Живые» токены: token -> {username, role, created_at} ---
TOKENS_DB: Dict[str, Dict] = {}
TOKEN_TTL_MINUTES = 60      # время жизни токена

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

def _unauthorized(detail="Invalid credentials"):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )

# ---------- Зависимости ----------
def _get_current_user(
    authorization: Annotated[str, Header()],
    require_role: str | None = None,
):
    # 1) схема
    if not authorization.startswith("Bearer "):
        _unauthorized("Invalid authentication scheme")

    token = authorization.split(" ", 1)[1]
    token_data = TOKENS_DB.get(token)
    # 2) токен присутствует?
    if not token_data:
        _unauthorized("Invalid or expired token")
    # 3) TTL
    age = datetime.datetime.utcnow() - token_data["created_at"]
    if age.total_seconds() > TOKEN_TTL_MINUTES * 60:
        TOKENS_DB.pop(token, None)               # чистим просроченный
        _unauthorized("Token expired")
    # 4) роль, если требуется
    if require_role and token_data["role"] != require_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    return token_data  # username, role, created_at

def token_verifier(authorization: Annotated[str, Header()]):
    return _get_current_user(authorization)

def admin_verifier(authorization: Annotated[str, Header()]):
    return _get_current_user(authorization, require_role="admin")

# ---------- Эндпоинты ----------
@app.post("/api/login", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = FAKE_USERS_DB.get(form_data.username)
    if not user or user["password"] != form_data.password:
        _unauthorized("Incorrect username or password")

    # генерируем уникальный токен
    access_token = str(uuid.uuid4())
    TOKENS_DB[access_token] = {
        "username": user["username"],
        "role":     user["role"],
        "created_at": datetime.datetime.utcnow(),
    }
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@app.post("/api/logout")
async def logout(authorization: Annotated[str, Header()]):
    token = authorization.split(" ", 1)[1] if authorization.startswith("Bearer ") else ""
    TOKENS_DB.pop(token, None)
    return {"detail": "Logged out"}

@app.get("/api/secret-data")
async def secret(user = Depends(token_verifier)):
    return {"message": f"Привет, {user['username']}! Секретное сообщение: 42."}

@app.get("/api/admin-data")
async def admin_data(user = Depends(admin_verifier)):
    return {"message": f"Привет, {user['username']}‑админ! Конфиденциальные данные."}
