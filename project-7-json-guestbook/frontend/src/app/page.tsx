'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';

interface Entry {
  id: string;
  name: string;
  message: string;
  timestamp: string;
}

const API_URL = 'http://127.0.0.1:8000/api/entries';
const LIMIT = 10;

export default function Guestbook() {
  // ---------------- Состояния ----------------
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
 
  // пагинация
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // редактирование
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // ---------------- API helpers ----------------
  const loadEntries = async (targetPage = page) => {
    try {
      const { data } = await axios.get<Entry[]>(
        `${API_URL}?page=${targetPage}&limit=${LIMIT}`,
      );
      setEntries(data);
      setHasNext(data.length === LIMIT);
      setPage(targetPage);
    } catch {
      setError('Не удалось загрузить записи.');
    }
  };

  const addEntry = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError('Имя и сообщение не могут быть пустыми.');
      return;
    }
    await axios.post(API_URL, { name, message });
    setName('');
    setMessage('');
    loadEntries(1);           // всегда возвращаемся на первую страницу
  };

  const deleteEntry = async (id: string) => {
    await axios.delete(`${API_URL}/${id}`);
    loadEntries(page);
  };

  const saveEdit = async (id: string) => {
    if (!editingText.trim()) {
      setError('Сообщение не может быть пустым.');
      return;
    }
    await axios.put(`${API_URL}/${id}`, { message: editingText });
    setEditingId(null);
    loadEntries(page);
  };

  // ---------------- Жизненный цикл ----------------
  useEffect(() => { loadEntries(1); }, []);

  // ---------------- UI ----------------
  return (
    <main className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Гостевая книга
        </h1>

        {/* ---- Форма ---- */}
        <form
          onSubmit={addEntry}
          className="bg-white p-6 mb-8 rounded-lg shadow-md"
        >
          <h2 className="text-2xl font-semibold mb-4">Оставить запись</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}

          <label className="block mb-2">
            <span className="text-gray-700">Ваше имя</span>
            <input
              className="w-full px-3 py-2 border rounded-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Аноним"
            />
          </label>

          <label className="block mb-4">
            <span className="text-gray-700">Сообщение</span>
            <textarea
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Всем привет!"
            />
          </label>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md"
          >
            Отправить
          </button>
        </form>

        {/* ---- Список записей ---- */}
        <div className="space-y-4">
          {entries.map((e) => (
            <div key={e.id} className="bg-white p-4 rounded-lg shadow">
              {editingId === e.id ? (
                <>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md mb-2"
                    rows={3}
                    value={editingText}
                    onChange={(ev) => setEditingText(ev.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      className="px-4 py-1 bg-green-600 text-white rounded-md"
                      onClick={() => saveEdit(e.id)}
                    >
                      Сохранить
                    </button>
                    <button
                      className="px-4 py-1 bg-gray-400 text-white rounded-md"
                      onClick={() => setEditingId(null)}
                    >
                      Отмена
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-800">{e.message}</p>
                  <div className="text-right text-sm text-gray-500 mt-2">
                    <strong>- {e.name}</strong>{' '}
                    {new Date(e.timestamp).toLocaleString()}
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded-md"
                      onClick={() => deleteEntry(e.id)}
                    >
                      Удалить
                    </button>
                    <button
                      className="px-3 py-1 bg-yellow-500 text-white rounded-md"
                      onClick={() => {
                        setEditingId(e.id);
                        setEditingText(e.message);
                      }}
                    >
                      Редактировать
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ---- Пагинация ---- */}
        <div className="flex justify-between mt-8">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300"
            disabled={page === 1}
            onClick={() => loadEntries(page - 1)}
          >
            ← Назад
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300"
            disabled={!hasNext}
            onClick={() => loadEntries(page + 1)}
          >
            Вперёд →
          </button>
        </div>
      </div>
    </main>
  );
}
