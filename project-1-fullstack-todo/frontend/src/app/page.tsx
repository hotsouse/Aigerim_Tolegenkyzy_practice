'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import ClearCompletedButton from '../../components/ClearCompletedButton';

interface Todo {
  id: string;
  task: string;
  completed: boolean;
}

const API = 'http://127.0.0.1:8000/api/todos';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const load = async () => {
    const { data } = await axios.get<Todo[]>(API);
    setTodos(data);
  };
  useEffect(() => { load(); }, []);

  /* ---------- CRUD ---------- */
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await axios.post(API, { task: newTask });
    setNewTask('');
    await load();
  };

  const toggle = async (todo: Todo) => {
    await axios.patch(`${API}/${todo.id}`, { completed: !todo.completed });
    await load();
  };

  const save = async () => {
    if (!editingId) return;
    await axios.put(`${API}/${editingId}`, { task: editText });
    setEditingId(null);
    await load();
  };

  const del = async (id: string) => {
    await axios.delete(`${API}/${id}`);
    await load();
  };

  /* ---------- UI ---------- */
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-cyan-400">Full‑Stack To‑Do</h1>

        {/* add */}
        <form onSubmit={add} className="flex gap-2 mb-6">
          <input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="Новая задача…"
            className="flex-grow p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 rounded">Add</button>
        </form>

        {/* list */}
        <ul className="space-y-3">
          {todos.map(t => (
            <li key={t.id} className="flex items-center p-3 bg-gray-700 rounded">
              {/* чек‑бокс */}
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => toggle(t)}
                className="mr-3 h-4 w-4 cursor-pointer accent-cyan-500"
              />
              {/* текст / редактирование */}
              {editingId === t.id ? (
                <>
                  <input
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="flex-grow bg-gray-600 p-1 mr-2 rounded"
                    autoFocus
                  />
                  <button onClick={save} className="bg-green-600 hover:bg-green-700 px-2 py-1 mr-1 rounded text-xs">💾</button>
                  <button onClick={() => setEditingId(null)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">✖</button>
                </>
              ) : (
                <>
                  <span
                    onDoubleClick={() => { setEditingId(t.id); setEditText(t.task); }}
                    className={`flex-grow select-none ${t.completed ? 'line-through text-gray-500' : ''}`}
                  >
                    {t.task}
                  </span>
                  <button
                    onClick={() => { setEditingId(t.id); setEditText(t.task); }}
                    className="bg-blue-600 hover:bg-blue-700 px-2 py-1 mr-1 rounded text-xs"
                  >✏️</button>
                  <button onClick={() => del(t.id)} className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">✕</button>
                </>
              )}
            </li>
          ))}
        </ul>

        <ClearCompletedButton onClear={load} />
      </div>
    </main>
  );
}
