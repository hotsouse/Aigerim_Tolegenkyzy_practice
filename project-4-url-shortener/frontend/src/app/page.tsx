'use client';

import { useState, FormEvent } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/shorten';

interface ShortenResponse {
  short_url: string;
  clicks: number;
  code: string;
  long_url: string;
  created_at: string;
  expires_in_days: number;
}

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [result, setResult] = useState<ShortenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);

    try {
      const payload: Record<string, string> = { long_url: longUrl };
      if (customCode.trim()) payload.custom_code = customCode.trim();

      const { data } = await axios.post<ShortenResponse>(API_URL, payload);
      setResult(data);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail[0]?.msg
        : detail || 'Неверный URL или ошибка сервера.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.short_url) return;
    navigator.clipboard.writeText(result.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-lg p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-cyan-400">Сокращатель Ссылок</h1>

        {/* ---- Форма ---- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Длинный URL */}
          <div>
            <label htmlFor="longUrl" className="block mb-2 text-sm font-medium text-gray-400">
              Длинный URL
            </label>
            <input
              id="longUrl"
              type="url"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              placeholder="https://example.com/very/long/url/to/shorten"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
              required
            />
          </div>

          {/* Кастомный код */}
          <div>
            <label htmlFor="customCode" className="block mb-2 text-sm font-medium text-gray-400">
              Кастомный код (необязательно)
            </label>
            <input
              id="customCode"
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="my_alias"
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:bg-cyan-800 transition-colors"
          >
            {loading ? 'Сокращаем...' : 'Сократить'}
          </button>
        </form>

        {/* ---- Ошибка ---- */}
        {error && (
          <div className="p-3 text-center text-red-400 bg-red-900/50 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* ---- Результат ---- */}
        {result && (
          <div className="p-4 space-y-3 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-400">Ваша короткая ссылка:</p>
            <div className="flex items-center gap-4">
              <a
                href={result.short_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-grow text-lg text-cyan-400 hover:underline break-all"
              >
                {result.short_url}
              </a>
              <button
                onClick={handleCopy}
                className="px-4 py-2 font-semibold text-sm bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
              >
                {copied ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>

            {/* Счётчик кликов */}
            <p className="text-sm text-gray-400">
              Просмотров: <span className="text-white">{result.clicks}</span>
            </p>

            {/* Информация о сроке действия */}
            <p className="text-xs text-gray-500">
              Срок действия: {result.expires_in_days} дней с&nbsp;{new Date(result.created_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
