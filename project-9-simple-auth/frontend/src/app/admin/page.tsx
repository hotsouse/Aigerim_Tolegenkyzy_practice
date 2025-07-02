'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Admin() {
  const router = useRouter();
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role  = localStorage.getItem('auth_role');
    if (!token || role !== 'admin') {
      router.replace('/login');
      return;
    }
    fetch('http://localhost:8000/api/admin-data', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(d => setMsg(d.message))
      .catch(() => router.replace('/dashboard'));
  }, [router]);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Админ‑панель</h1>
      <p>{msg}</p>
    </div>
  );
}
