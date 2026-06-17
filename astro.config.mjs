// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import node from '@astrojs/node';
import auth from 'auth-astro';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://007-sama.vercel.app',
  adapter: node({ mode: 'standalone' }),
  image: {
    remotePatterns: [{ protocol: 'https' }],
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        const excluded = ['/admin/', '/account/', '/auth/', '/api/', '/checkout/'];
        return !excluded.some((p) => page.includes(p));
      },
      serialize: (item) => {
        const url = new URL(item.url).pathname;
        if (url === '/') {
          item.priority = 1.0;
          item.changefreq = 'monthly';
        } else if (url.startsWith('/games') || url.startsWith('/news')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        } else if (url.startsWith('/legal')) {
          item.priority = 0.3;
          item.changefreq = 'monthly';
        } else {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
    auth(),
  ],
  vite: {
    plugins: [tailwind()],
  },
});
