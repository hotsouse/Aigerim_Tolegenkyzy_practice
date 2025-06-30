'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import MarkdownRenderer from '../../../components/MarkdownRenderer';  // ← 4 ../

interface Post {
  id: number;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  content: string;
}

const API_URL = ' http://127.0.0.1:8000/api/posts';

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();

  const [post, setPost]   = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    axios
      .get<Post>(`${API_URL}/${slug}`)
      .then(r => setPost(r.data))
      .catch(err =>
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.detail || 'Пост не найден'
            : 'Ошибка сети'
        )
      )
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="text-center p-10">Загрузка…</p>;
  if (error)   return <p className="text-center p-10 text-red-500">{error}</p>;
  if (!post)   return <p className="text-center p-10">Пост не найден</p>;

  return (
    <article className="max-w-3xl mx-auto p-8">
      <Link href="/" className="text-blue-500 hover:underline mb-8 block">
        &larr; Назад
      </Link>

      <h1 className="text-4xl font-extrabold mb-1">{post.title}</h1>
      <p className="text-sm text-gray-500 mb-8">
        {post.author} • {new Date(post.date).toLocaleDateString()} • {post.category}
      </p>

      <MarkdownRenderer content={post.content} />
    </article>
  );
}
