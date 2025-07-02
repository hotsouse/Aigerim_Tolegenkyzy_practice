// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* другие настройки, если есть */
  images: {
    domains: ['openweathermap.org'],           // ← разрешаем загружать иконки
    /* либо, если нужен более тонкий контроль:
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'openweathermap.org',
        pathname: '/img/wn/**',
      },
    ],
    */
  },
};

export default nextConfig;
