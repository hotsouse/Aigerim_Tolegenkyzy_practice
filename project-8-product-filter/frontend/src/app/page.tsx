'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
}

const API_URL = 'http://localhost:8000/api';

export default function Home() {
  // --- Данные ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // --- Фильтры ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');   // <— NEW
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('price_asc');     // <— NEW
  const [minPrice, setMinPrice] = useState('');                  // <— NEW
  const [maxPrice, setMaxPrice] = useState('');                  // <— NEW

  const [loading, setLoading] = useState(true);

  // 1) Получаем категории один раз
  useEffect(() => {
    axios.get(`${API_URL}/categories`)
      .then(res => setCategories(['All', ...res.data]))
      .catch(err => console.error(err));
  }, []);

  // 2) Debounce для поля поиска (400 мс)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // 3) Подгружаем товары при изменении любого фильтра
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (debouncedSearch) params.append('search', debouncedSearch);
        if (selectedCategory !== 'All') params.append('category', selectedCategory);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        if (sortOption) params.append('sort', sortOption);

        const res = await axios.get(`${API_URL}/products?${params.toString()}`);
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch, selectedCategory, sortOption, minPrice, maxPrice]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">Каталог товаров</h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* ФИЛЬТРЫ */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 bg-white p-4 rounded-lg shadow">
          {/* Поиск */}
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded-md w-full"
          />

          {/* Категория */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded-md w-full"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Сортировка */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="p-2 border rounded-md w-full"
          >
            <option value="price_asc">По цене: сначала дешёвые</option>
            <option value="price_desc">По цене: сначала дорогие</option>
          </select>

          {/* Диапазон цен */}
          <input
            type="number"
            min="0"
            placeholder="Минимум"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="p-2 border rounded-md w-full"
          />
          <input
            type="number"
            min="0"
            placeholder="Максимум"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="p-2 border rounded-md w-full"
          />
        </div>

        {/* ТОВАРЫ */}
        {loading ? (
          <p className="text-center">Загрузка товаров…</p>
        ) : products.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(p => (
              <div
                key={p.id}
                className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="p-6">
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {p.category}
                  </span>
                  <h2 className="text-lg font-bold text-gray-800 mt-2 h-14 overflow-hidden">
                    {p.name}
                  </h2>
                  <p className="text-2xl font-light text-blue-600 mt-4">
                    ${p.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center">Товары не найдены.</p>
        )}
      </main>
    </div>
  );
}
