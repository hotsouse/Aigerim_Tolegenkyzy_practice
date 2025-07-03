import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api' });

api.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('auth_token');
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

export default api;
