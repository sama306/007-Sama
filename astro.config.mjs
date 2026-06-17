// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import vercel from '@astrojs/vercel/serverless';
import auth from 'auth-astro';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  site: 'https://007-sama.vercel.app',
  adapter: vercel(),
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
          item.changefreq = /** @type {any} */ ('monthly');
        } else if (url.startsWith('/games') || url.startsWith('/news')) {
          item.priority = 0.8;
          item.changefreq = /** @type {any} */ ('weekly');
        } else if (url.startsWith('/legal')) {
          item.priority = 0.3;
          item.changefreq = /** @type {any} */ ('monthly');
        } else {
          item.priority = 0.6;
          item.changefreq = /** @type {any} */ ('monthly');
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
