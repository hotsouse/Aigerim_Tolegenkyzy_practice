'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/utils/api';

export type Post = {
  id: string;
  text: string;
  timestamp: string;
  owner_id: string;
  owner_username: string;
  likes: number;
  liked_by_me: boolean;
};

interface Props {
  post: Post;
  currentUserId: string | null;   // uuid текущего юзера (может быть null)
  onChange: () => void;           // коллбек: перезагрузить ленту
}

export default function PostCard({ post, currentUserId, onChange }: Props) {
  const [liked, setLiked]   = useState(post.liked_by_me);
  const [likes, setLikes]   = useState(post.likes);

  /* -------------------- КТО ВЛАДЕЛЕЦ? -------------------- */
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  /** «Мой» пост, если совпал uuid ИЛИ username */
  const mine = (currentUserId && currentUserId === post.owner_id) || token === post.owner_username;
  /* ------------------------------------------------------- */

  async function toggle() {
    try {
      liked
        ? await api.delete(`/posts/${post.id}/like`)
        : await api.post(`/posts/${post.id}/like`);
      setLiked(!liked);
      setLikes((c) => (liked ? c - 1 : c + 1));
    } catch (e: any) {
      if (e?.response?.status === 409) onChange(); // уже лайкнул
      else console.error(e);
    }
  }

  async function del() {
    if (!mine || !confirm('Удалить пост?')) return;
    await api.delete(`/posts/${post.id}`);
    onChange();
  }

  return (
    <div className="border rounded p-4 space-y-2 relative">
      {mine && (
        <button
          onClick={del}
          className="absolute top-2 right-2 text-red-500"
          title="Удалить пост"
        >
          🗑
        </button>
      )}

      <p>{post.text}</p>

      <div className="text-sm flex gap-4 items-center select-none">
        <Link
          href={`/users/${post.owner_username}`}
          className="text-blue-600 hover:underline"
        >
          👤 {post.owner_username}
        </Link>
        <span>🗓 {new Date(post.timestamp).toLocaleString()}</span>

        <button onClick={toggle} className="ml-auto">
          {liked ? '💙' : '🤍'} {likes}
        </button>
      </div>
    </div>
  );
}
