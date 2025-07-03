# backend/main.py
import os
import uuid
from datetime import datetime, timezone
from typing import List, Annotated, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import SQLModel, Field, Session, select, create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

# ---------- CORS ----------
app = FastAPI()
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Путь к базе ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "app.db")

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)

# ---------- SQLModel таблицы ----------
class UserModel(SQLModel, table=True):
    id: str = Field(primary_key=True)
    username: str = Field(unique=True, index=True)
    password: str                 # в проде храните хэш!


class PostModel(SQLModel, table=True):
    id: str = Field(primary_key=True, default_factory=lambda: str(uuid.uuid4()))
    text: str
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), index=True
    )
    owner_id: str = Field(foreign_key="usermodel.id")
    owner_username: str


class LikeModel(SQLModel, table=True):
    user_id: str = Field(foreign_key="usermodel.id", primary_key=True)
    post_id: str = Field(foreign_key="postmodel.id", primary_key=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def create_db_and_seed() -> None:
    """Создаёт таблицы и двух тестовых пользователей."""
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        for username, pwd in (("user1", "password1"), ("user2", "password2")):
            exists = session.exec(
                select(UserModel).where(UserModel.username == username)
            ).first()
            if not exists:
                session.add(
                    UserModel(id=str(uuid.uuid4()), username=username, password=pwd)
                )
        session.commit()


create_db_and_seed()

# ---------- Pydantic схемы (для ответов) ----------
class User(BaseModel):
    id: str
    username: str


class Post(BaseModel):
    id: str
    text: str
    timestamp: datetime
    owner_id: str
    owner_username: str
    likes: int = 0
    liked_by_me: bool = False


class PostCreate(BaseModel):
    text: str


# ---------- Аутентификация ----------
async def get_current_user(
    authorization: Annotated[Optional[str], Header()] = None
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="No/invalid token")

    token = authorization.split(" ", 1)[1]
    with Session(engine) as session:
        user_row = session.exec(
            select(UserModel).where(UserModel.username == token)
        ).first()
        if not user_row:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Bad token")
        return User(id=user_row.id, username=user_row.username)


@app.post("/api/login")
async def login(form_data: dict):
    username, password = form_data.get("username"), form_data.get("password")
    with Session(engine) as session:
        user_row = session.exec(
            select(UserModel).where(UserModel.username == username)
        ).first()
        if not user_row or user_row.password != password:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Wrong credentials")
        return {
            "access_token": user_row.username,  # токен = username
            "token_type": "bearer",
            "user": {"id": user_row.id, "username": user_row.username},
        }


# ---------- Вспомогательная функция ----------
def _post_to_schema(db_post: PostModel, user_id: str | None, session: Session) -> Post:
    # количество лайков (возвращает int)
    likes_cnt = session.exec(
        select(func.count())
        .select_from(LikeModel)
        .where(LikeModel.post_id == db_post.id)
    ).one()

    # лайкнул ли текущий пользователь (int, >0 значит лайкнул)
    liked_by_me = False
    if user_id:
        liked_by_me = (
            session.exec(
                select(func.count())
                .select_from(LikeModel)
                .where(
                    LikeModel.post_id == db_post.id,
                    LikeModel.user_id == user_id,
                )
            ).one()
            > 0
        )

    return Post.model_validate(
        {
            **db_post.model_dump(),
            "likes": likes_cnt,
            "liked_by_me": liked_by_me,
        }
    )

# ---------- Эндпоинты постов ----------
@app.get("/api/posts", response_model=List[Post])
def list_posts(
    current_user: Annotated[Optional[User], Depends(get_current_user)] = None
):
    with Session(engine) as session:
        posts = session.exec(
            select(PostModel).order_by(PostModel.timestamp.desc())
        ).all()
        return [
            _post_to_schema(p, current_user.id if current_user else None, session)
            for p in posts
        ]


@app.get("/api/users/{username}/posts", response_model=List[Post])
def posts_by_author(username: str):
    with Session(engine) as session:
        author = session.exec(
            select(UserModel).where(UserModel.username == username)
        ).first()
        if not author:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Author not found")
        posts = session.exec(
            select(PostModel)
            .where(PostModel.owner_id == author.id)
            .order_by(PostModel.timestamp.desc())
        ).all()
        return [_post_to_schema(p, None, session) for p in posts]


@app.post("/api/posts", response_model=Post, status_code=201)
def create_post(
    post_data: PostCreate, current_user: Annotated[User, Depends(get_current_user)]
):
    with Session(engine) as session:
        db_post = PostModel(
            text=post_data.text,
            owner_id=current_user.id,
            owner_username=current_user.username,
        )
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
        return _post_to_schema(db_post, current_user.id, session)


@app.delete("/api/posts/{post_id}", status_code=204)
def delete_post(
    post_id: str, current_user: Annotated[User, Depends(get_current_user)]
):
    with Session(engine) as session:
        post = session.get(PostModel, post_id)
        if not post:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Post not found")
        if post.owner_id != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not your post")
        session.delete(post)
        session.commit()


# ---------- Лайки ----------
@app.post("/api/posts/{post_id}/like", status_code=201)
def like_post(
    post_id: str, current_user: Annotated[User, Depends(get_current_user)]
):
    with Session(engine) as session:
        if not session.get(PostModel, post_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Post not found")
        like = LikeModel(user_id=current_user.id, post_id=post_id)
        session.add(like)
        try:
            session.commit()
        except IntegrityError:
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Already liked")
        return {"detail": "liked"}


@app.delete("/api/posts/{post_id}/like", status_code=204)
def unlike_post(
    post_id: str, current_user: Annotated[User, Depends(get_current_user)]
):
    with Session(engine) as session:
        like = session.get(LikeModel, {"user_id": current_user.id, "post_id": post_id})
        if not like:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Like not found")
        session.delete(like)
        session.commit()
