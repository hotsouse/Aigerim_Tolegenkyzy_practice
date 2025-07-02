'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const role = typeof window !== 'undefined' ? localStorage.getItem('auth_role') : null;

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    fetch('http://localhost:8000/api/secret-data', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setMsg(d.message))
      .catch(() => router.replace('/login'));
  }, [router]);

  function logout() {
    const token = localStorage.getItem('auth_token');
    fetch('http://localhost:8000/api/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).finally(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      router.push('/login');
    });
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Dashboard</h1>
      <p>{msg}</p>
      {role === 'admin' && (
        <p className="mt-6">
          <Link href="/admin" className="underline text-blue-600">Перейти в админ‑панель →</Link>
        </p>
      )}
      <button onClick={logout} className="mt-10 underline text-red-600">Выйти</button>
    </div>
  );
}
