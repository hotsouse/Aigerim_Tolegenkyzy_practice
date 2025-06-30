'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Post {
  id: number;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
}

const API_URL = 'http://127.0.0.1:8000/api/posts';  // Явное указание адреса

export default function HomePage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get<Post[]>(API_URL, {
      headers: {
        'Accept': 'application/json; charset=utf-8',  // Явно указываем кодировку
      },
      responseType: 'json',
    })
      .then((response) => {
        setPosts(response.data);
      })
      .catch((err) => {
        console.error('Ошибка:', err);
        setError('Не удалось загрузить посты. Проверьте консоль.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center p-10">Загрузка…</p>;
  if (error) return <p className="text-center p-10 text-red-500">{error}</p>;
  if (!posts?.length) return <p className="text-center p-10">Постов нет</p>;

  return (
    <div className="container mx-auto max-w-3xl p-8">
      {posts.map((post) => (
        <Link key={post.slug} href={`/posts/${post.slug}`}>
          <article className="border-b py-4 cursor-pointer">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-sm text-gray-500">
              {post.author} • {new Date(post.date).toLocaleDateString()} • {post.category}
            </p>
          </article>
        </Link>
      ))}
    </div>
  );
}