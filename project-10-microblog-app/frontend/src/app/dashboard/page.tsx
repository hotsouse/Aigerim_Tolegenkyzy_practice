'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import NewPostForm from '../../../components/NewPostForm';
import PostCard, { type Post } from '../../../components/PostCard';

/* получаем токен и uuid текущего юзера */
function getAuth() {
  if (typeof window === 'undefined') return { token: null, uid: null };
  return {
    token: localStorage.getItem('auth_token'), // username
    uid: localStorage.getItem('user_id'),      // uuid
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const { token, uid } = getAuth();

  async function load() {
    try {
      const { data } = await api.get<Post[]>('/posts');
      setPosts(data);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        localStorage.clear();
        router.replace('/login');
      }
    }
  }

  useEffect(() => {
    if (!token) { router.replace('/login'); return; }
    load();
  }, [router, token]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Лента</h1>
        <button
          onClick={() => { localStorage.clear(); router.replace('/login'); }}
          className="text-sm text-red-600 underline"
        >
          Выйти
        </button>
      </div>

      <NewPostForm onCreated={load} />

      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          currentUserId={uid}   /* ← передаём uuid */
          onChange={load}
        />
      ))}
    </div>
  );
}
