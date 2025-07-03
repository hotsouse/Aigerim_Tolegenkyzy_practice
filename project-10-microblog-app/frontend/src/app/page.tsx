'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return null; // можно показать лоадер, если хочешь
}
