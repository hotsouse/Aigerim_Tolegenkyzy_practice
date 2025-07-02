import secrets
from datetime import datetime, timedelta
from typing import Dict

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, HttpUrl, Field

app = FastAPI()

# ---------- CORS ----------
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Псевдо‑БД ----------
# {"short": {"long_url": str, "clicks": int, "created_at": datetime}}
url_db: Dict[str, Dict] = {}

# Через сколько дней ссылка “протухает”
EXPIRATION_DAYS = 30

# ---------- Pydantic ----------
class URLCreate(BaseModel):
    long_url: HttpUrl
    # Пользовательский код (a–z, A–Z, 0–9, _ и -). Необязателен.
    custom_code: str | None = Field(
        default=None,
        min_length=1,
        max_length=64,
        pattern=r"^[A-Za-z0-9_-]+$",
        description="Желаемый короткий код",
    )

class URLInfo(BaseModel):
    short_url: str
    code: str
    long_url: str
    clicks: int
    created_at: datetime
    expires_in_days: int = EXPIRATION_DAYS

# ---------- API ----------

@app.post("/api/shorten", response_model=URLInfo, status_code=status.HTTP_201_CREATED)
def create_short_url(url_data: URLCreate, request: Request):
    """
    Создать короткую ссылку.
    Принимает обязательный long_url и необязательный custom_code.
    """
    long_url = str(url_data.long_url)

    # 1. Выбираем короткий код
    if url_data.custom_code:
        short_code = url_data.custom_code
        if short_code in url_db:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Такой короткий код уже занят",
            )
    else:
        # Генерируем случайный, пока не станет уникальным
        short_code = secrets.token_urlsafe(6)
        while short_code in url_db:
            short_code = secrets.token_urlsafe(6)

    # 2. Сохраняем в "БД"
    now = datetime.utcnow()
    url_db[short_code] = {
        "long_url": long_url,
        "clicks": 0,
        "created_at": now,
    }

    # 3. Формируем ответ
    base_url = str(request.base_url)
    short_url = f"{base_url}{short_code}"

    return URLInfo(
        short_url=short_url,
        code=short_code,
        long_url=long_url,
        clicks=0,
        created_at=now,
    )

@app.get("/{short_code}")
def redirect_to_long_url(short_code: str):
    """
    Перенаправить на длинный URL.
    Увеличивает счётчик и проверяет срок действия.
    """
    record = url_db.get(short_code)
    if not record:
        raise HTTPException(status_code=404, detail="Short URL not found")

    # Проверка срока действия
    if datetime.utcnow() - record["created_at"] > timedelta(days=EXPIRATION_DAYS):
        # Можно сразу удалить запись, чтобы не занимать память
        url_db.pop(short_code, None)
        raise HTTPException(status_code=404, detail="Short URL expired")

    # Инкремент кликов
    record["clicks"] += 1

    return RedirectResponse(url=record["long_url"], status_code=status.HTTP_307_TEMPORARY_REDIRECT)

@app.get("/api/info/{short_code}", response_model=URLInfo)  # необязательно фронту, но вдруг пригодится
def get_short_url_info(short_code: str, request: Request):
    """
    Получить информацию о ссылке (длины, клики, дата создания).
    """
    record = url_db.get(short_code)
    if not record:
        raise HTTPException(status_code=404, detail="Short URL not found")

    base_url = str(request.base_url)
    return URLInfo(
        short_url=f"{base_url}{short_code}",
        code=short_code,
        long_url=record["long_url"],
        clicks=record["clicks"],
        created_at=record["created_at"],
    )
