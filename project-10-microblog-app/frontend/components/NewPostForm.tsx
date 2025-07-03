'use client';
import { useState } from 'react';
import api from '@/utils/api';

export default function NewPostForm({ onCreated }: { onCreated: () => void }) {
  const [text, setText] = useState('');

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    const val = text.trim();
    if (!val) return;
    await api.post('/posts', { text: val });
    setText('');
    onCreated();
  }

  return (
    <form onSubmit={handle} className="flex gap-2 mb-4">
      <input
        className="flex-1 border rounded p-2"
        placeholder="Что нового?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="bg-blue-600 text-white px-4 rounded">Опубликовать</button>
    </form>
  );
}
