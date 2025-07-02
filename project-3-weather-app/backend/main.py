"""
backend/main.py
FastAPI‑прокси к OpenWeatherMap: текущая погода, прогноз, запрос по координатам.
"""

import os
from typing import List, Dict

import httpx
from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ──────────────────────────
# 1.  Конфигурация ENV
# ──────────────────────────
# load_dotenv ищет .env в текущей директории; find_dotenv поднимается вверх по дереву
load_dotenv(find_dotenv())                       # «прозрачно» ищет .env хоть в корне

API_KEY = os.getenv("OPENWEATHER_API_KEY")
if not API_KEY:
    raise RuntimeError(
        "\n❌  Переменная OPENWEATHER_API_KEY не найдена!\n"
        "   Создайте файл backend/.env (или .env в корне) и впишите:\n"
        "   OPENWEATHER_API_KEY=ВАШ_КЛЮЧ_ОТ_OpenWeatherMap\n"
        "   После этого перезапустите сервер.\n"
    )
print("[DBG] OpenWeather API key loaded, length =", len(API_KEY))  # можно удалить позже

BASE_URL = "https://api.openweathermap.org/data/2.5"
UNITS = "metric"
LANG = "ru"

# ──────────────────────────
# 2.  FastAPI + CORS
# ──────────────────────────
app = FastAPI(title="Weather Proxy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────
# 3.  Pydantic‑схемы
# ──────────────────────────
class Weather(BaseModel):
    city: str
    temp: float
    description: str
    icon: str


class ForecastDay(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    description: str
    icon: str


# ──────────────────────────
# 4.  Вспомогательный клиент
# ──────────────────────────
async def owm_get(path: str, **params) -> Dict:
    """
    Выполняет GET к `path` на OpenWeatherMap, добавляя ключ и общие параметры.
    Бросает HTTPException, если статус ответа != 200.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{BASE_URL}/{path}",
            params={**params, "appid": API_KEY, "units": UNITS, "lang": LANG},
        )

    if r.status_code == 404:
        raise HTTPException(404, "Город не найден")
    if r.status_code != 200:
        # сообщение OWM, например «Invalid API key.»
        raise HTTPException(r.status_code, r.json().get("message", "Ошибка OpenWeatherMap"))

    return r.json()


# ──────────────────────────
# 5.  Эндпоинты
# ──────────────────────────
@app.get("/api/weather/{city}", response_model=Weather, tags=["Weather"])
async def weather_by_city(city: str) -> Weather:
    data = await owm_get("weather", q=city)
    return Weather(
        city=data["name"],
        temp=data["main"]["temp"],
        description=data["weather"][0]["description"],
        icon=data["weather"][0]["icon"],
    )


@app.get("/api/forecast/{city}", response_model=List[ForecastDay], tags=["Forecast"])
async def forecast_by_city(city: str) -> List[ForecastDay]:
    raw = await owm_get("forecast", q=city)

    buckets: Dict[str, list] = {}
    for item in raw["list"]:                       # шаг 3 ч, 40 точек
        date_key = item["dt_txt"][:10]            # YYYY‑MM‑DD
        buckets.setdefault(date_key, []).append(item)

    forecast: list[ForecastDay] = []
    for date_str, chunk in list(buckets.items())[:5]:
        temps = [c["main"]["temp"] for c in chunk]
        first = chunk[0]
        forecast.append(
            ForecastDay(
                date=date_str,
                temp_min=min(temps),
                temp_max=max(temps),
                description=first["weather"][0]["description"],
                icon=first["weather"][0]["icon"],
            )
        )
    return forecast


@app.get("/api/weather/coords", response_model=Weather, tags=["Weather"])
async def weather_by_coords(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
) -> Weather:
    data = await owm_get("weather", lat=lat, lon=lon)
    return Weather(
        city=data["name"],
        temp=data["main"]["temp"],
        description=data["weather"][0]["description"],
        icon=data["weather"][0]["icon"],
    )


# ──────────────────────────
# 6.  Локальный запуск
# ──────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
