'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import Image from 'next/image';

const API_URL = 'http://localhost:8000';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // --- utils ---------------------------------------------------
  const fullUrl = (rel: string) =>
    rel.startsWith('http') ? rel : `${API_URL}${rel.startsWith('/') ? '' : '/'}${rel}`;

  const fetchImages = async () => {
    try {
      const { data } = await axios.get<string[]>(`${API_URL}/api/images`);
      setImages(data);
    } catch (e) {
      console.error(e);
      setError('Не удалось загрузить галерею.');
    }
  };

  // --- lifecycle ----------------------------------------------
  useEffect(() => { fetchImages(); }, []);

  // --- handlers ------------------------------------------------
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const fd = new FormData();
    fd.append('file', selectedFile);

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      await axios.post(`${API_URL}/api/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ev => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });
      setSelectedFile(null);
      await fetchImages();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки файла.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (img: string) => {
    const filename = img.split('/').pop();
    if (!filename) return;
    try {
      await axios.delete(`${API_URL}/api/images/${filename}`);
      setImages(prev => prev.filter(i => i !== img));
    } catch (err) {
      console.error(err);
      setError('Не удалось удалить файл.');
    }
  };

  // --- render --------------------------------------------------
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Галерея изображений</h1>

      <form
        onSubmit={handleUpload}
        className="max-w-md mx-auto bg-white p-6 rounded-lg shadow mb-12 space-y-4"
      >
        <div>
          <label htmlFor="file" className="block text-sm font-bold mb-2">
            Выберите изображение:
          </label>
          <input
            id="file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
          />
        </div>

        {progress > 0 && progress < 100 && (
          <div className="w-full bg-gray-200 h-2 rounded">
            <div
              className="bg-blue-600 h-2 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {uploading ? 'Загрузка...' : 'Загрузить'}
        </button>

        {error && <p className="text-red-500 text-xs italic">{error}</p>}
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(img => (
          <div key={img} className="relative aspect-square rounded-lg overflow-hidden shadow">
            <Image
              src={fullUrl(img)}
              alt="Изображение"
              fill
              className="object-cover"
              sizes="(max-width:768px)100vw,(max-width:1200px)50vw,33vw"
            />
            <button
              onClick={() => handleDelete(img)}
              className="absolute top-2 right-2 bg-white/70 text-red-600
                         rounded-full p-1 hover:bg-white"
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
