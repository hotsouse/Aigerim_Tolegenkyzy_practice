'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);

    const res = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (res.ok) {
      const { access_token, role } = await res.json();
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('auth_role', role);
      router.push('/dashboard');
    } else {
      alert('Неверный логин или пароль');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto mt-24">
      <h1 className="text-xl font-semibold text-center">Вход</h1>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Логин"
             className="border p-2 rounded"/>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль"
             className="border p-2 rounded"/>
      <button type="submit" className="border p-2 rounded bg-zinc-800 text-white">Войти</button>
    </form>
  );
}
