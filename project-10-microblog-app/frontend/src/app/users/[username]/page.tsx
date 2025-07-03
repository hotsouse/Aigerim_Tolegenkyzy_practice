'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/utils/api';
import PostCard, { type Post } from '../../../../components/PostCard';

function getCurrentUserId(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
}

export default function UserFeed() {
  const { username } = useParams<{ username: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const uid = getCurrentUserId();

  const reload = () => {
    api
      .get<Post[]>(`/users/${username}/posts`)
      .then((r) => setPosts(r.data))
      .catch(console.error);
  };

  useEffect(reload, [username]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Посты {username}</h1>

      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          currentUserId={uid}   /* ← то же имя пропа */
          onChange={reload}
        />
      ))}
    </div>
  );
}
