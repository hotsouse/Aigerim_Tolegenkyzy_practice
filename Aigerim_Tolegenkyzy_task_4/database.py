from typing import Dict, Optional
def get_user_by_username(username: str):
    if username == "admin":
        return {
            "username": "admin",
            "hashed_password": "$2b$12$KIXLkJhrfzYbqRPa0yL0nOtB/8t1LaPchvFqDy0v3l7YVZh0Z/1uW"  
        }
    return None
fake_users_db: Dict[str, Dict] = {}

def get_user_by_username(username: str) -> Optional[Dict]:
    return fake_users_db.get(username)

def create_user(user: Dict):
    """Создает нового пользователя во временной БД"""
    username = user["username"]
    if username in fake_users_db:
        raise ValueError("User already exists")
    fake_users_db[username] = user