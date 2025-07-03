'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const { data } = await axios.post('http://127.0.0.1:8000/api/login', {
        username,
        password,
      });
      localStorage.setItem('auth_token', data.access_token); // username
      localStorage.setItem('user_id', data.user.id);         // uuid
      router.replace('/dashboard');
    } catch (e: any) {
      setErr(e?.response?.status === 401 ? 'Неверные данные' : 'Ошибка сервера');
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow space-y-4">
        <h1 className="text-2xl font-bold text-center">Вход</h1>
        <input className="w-full border p-2" placeholder="Логин"
          value={username} onChange={e=>setUsername(e.target.value)} required/>
        <input className="w-full border p-2" type="password" placeholder="Пароль"
          value={password} onChange={e=>setPassword(e.target.value)} required/>
        {err && <p className="text-red-600">{err}</p>}
        <button className="w-full bg-blue-600 text-white py-2 rounded">Войти</button>
      </form>
    </div>
  );
}
