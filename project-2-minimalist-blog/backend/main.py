from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List
import json

# --- Конфигурация приложения ---
app = FastAPI()

# --- Настройка CORS ---
origins = [
    "http://localhost:3000",
    "http://192.168.1.3:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Исправлено: было allow_origins -> allow_origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic модели ---
class PostBase(BaseModel):
    id: int
    slug: str
    title: str
    author: str = Field(..., example="Aigerim")
    date: str = Field(..., example="2025-06-29")
    category: str = Field(..., example="Programming")

    class Config:
        json_encoders = {
            # Добавляем кастомные сериализаторы при необходимости
        }

class PostFull(PostBase):
    content: str

# --- "База данных" ---
fake_posts_db: List[PostFull] = [
    PostFull(
        id=1,
        slug="first-post",
        title="Мой первый пост",
        author="Aigerim",
        date="2025-06-29",
        category="private",
        content="Текст поста..."
    ),
    # ... остальные посты
]

# --- Эндпоинты ---
@app.get("/api/posts", response_model=List[PostBase])
async def get_all_posts():
    posts = [p.dict() for p in fake_posts_db]  # Используем .dict() вместо PostBase(**p.dict())
    return JSONResponse(content=posts, media_type="application/json; charset=utf-8")

@app.get("/api/posts/{slug}", response_model=PostFull)
async def get_post_by_slug(slug: str):
    post = next((p for p in fake_posts_db if p.slug == slug), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return JSONResponse(content=post.dict(), media_type="application/json; charset=utf-8")

@app.get("/")
async def root():
    return {"message": "Blog API is running"}