'use client';

import { useState, useEffect, FormEvent } from 'react';
import Image from 'next/image';

/* ---------- типы, совпадающие с ответами бекенда ---------- */
interface Weather {
  city: string;
  temp: number;
  description: string;
  icon: string;
}

interface ForecastDay {
  date: string;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
}

/* ---------- базовый URL бекенда ---------- */
const BACKEND = 'http://127.0.0.1:8000';

export default function Home() {
  /* состояние */
  const [cityInput, setCityInput] = useState('Almaty'); // то, что в инпуте
  const [city, setCity] = useState('Almaty');           // «текущий» город
  const [weather, setWeather] = useState<Weather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---------- универсальный fetch с обработкой ошибок ---------- */
  async function fetchJSON<T>(url: string): Promise<T> {
    const r = await fetch(url);
    if (!r.ok) {
      const msg = (await r.json()).detail ?? 'Ошибка сети';
      throw new Error(msg);
    }
    return r.json();
  }

  /* ---------- запрос погоды/прогноза по городу ---------- */
  async function loadByCity(c: string) {
    setLoading(true);
    setError('');
    try {
      const [w, f] = await Promise.all([
        fetchJSON<Weather>(`${BACKEND}/api/weather/${encodeURIComponent(c)}`),
        fetchJSON<ForecastDay[]>(`${BACKEND}/api/forecast/${encodeURIComponent(c)}`),
      ]);
      setCity(w.city);
      setWeather(w);
      setForecast(f);
    } catch (e: any) {
      setError(e.message);
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- при первом рендере — пробуем геолокацию ---------- */
  useEffect(() => {
  if (!navigator.geolocation) {
    loadByCity('Almaty');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      try {
        // 1) текущая погода по координатам
        const w = await fetchJSON<Weather>(
          `${BACKEND}/api/weather/coords?lat=${latitude}&lon=${longitude}`,
        );
        setCity(w.city);
        setWeather(w);

        // 2) прогноз на 5 дней для найденного города
        const f = await fetchJSON<ForecastDay[]>(
          `${BACKEND}/api/forecast/${encodeURIComponent(w.city)}`,
        );
        setForecast(f);              // <-- теперь типы совпадают
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    /* если пользователь отклонил гео → грузим Алмату */
    () => loadByCity('Almaty'),
    { timeout: 10_000 },
  );
}, []);   // пустой массив зависимостей — код выполнится однократно


  /* ---------- submit формы ---------- */
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (cityInput.trim()) loadByCity(cityInput.trim());
  }

  /* ---------- UI ---------- */
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-300 p-4">
      <div className="w-full max-w-md bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Погода</h1>

        {/* форма поиска */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Введите город"
            className="flex-grow p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold p-2 rounded-lg disabled:bg-blue-300"
          >
            {loading ? '...' : '➔'}
          </button>
        </form>

        {/* состояние */}
        {loading && <p className="text-center text-gray-700">Загрузка…</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* текущая погода */}
        {weather && (
          <div className="flex flex-col items-center text-center text-gray-900">
            <h2 className="text-3xl font-semibold">{city}</h2>
            <div className="flex items-center">
              <p className="text-6xl font-light">{Math.round(weather.temp)}°C</p>
              <Image
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                width={100}
                height={100}
              />
            </div>
            <p className="text-lg capitalize">{weather.description}</p>
          </div>
        )}

        {/* прогноз */}
        {forecast.length > 0 && (
          <ul className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6">
            {forecast.map((d) => (
              <li
                key={d.date}
                className="border border-gray-300 rounded-xl p-3 text-center bg-white/60"
              >
                <p className="text-sm">
                  {new Date(d.date).toLocaleDateString('ru-RU', {
                    weekday: 'short',
                    day: 'numeric',
                  })}
                </p>
                <Image
                  src={`https://openweathermap.org/img/wn/${d.icon}.png`}
                  alt={d.description}
                  width={50}
                  height={50}
                  className="mx-auto"
                />
                <p className="text-sm">
                  {Math.round(d.temp_min)}° / {Math.round(d.temp_max)}°
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
