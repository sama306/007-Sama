# Módulo de Noticias — Content Collections + RSS + SEO

> **Framework:** Astro 6.x  
> **Colección:** `src/content/news/`  
> **Propósito:** Gestión completa de artículos con flujo editorial, filtrado, RSS, y SEO semántico.

---

## Índice

1. [Schema de la Colección "news" (Zod)](#1-schema-de-la-colección-news-zod)
2. [Flujo Editorial: Crear y Publicar un Artículo](#2-flujo-editorial-crear-y-publicar-un-artículo)
3. [Filtrado y Ordenación](#3-filtrado-y-ordenación)
4. [Generación de Páginas Estáticas con `getStaticPaths`](#4-generación-de-páginas-estáticas-con-getstaticpaths)
5. [Componente NewsCard y Artículo Completo con MDX](#5-componente-newscard-y-artículo-completo-con-mdx)
6. [RSS Feed de Noticias](#6-rss-feed-de-noticias)
7. [SEO: Open Graph, Meta Description, Structured Data](#7-seo-open-graph-meta-description-structured-data)

---

## 1. Schema de la Colección "news" (Zod)

### `src/content/config.ts`

```ts
import { defineCollection, z } from 'astro:content';

const categoryEnum = [
  'lanzamientos',
  'review',
  'eventos',
  'ofertas',
  'industria',
  'tutoriales',
  'opinion',
] as const;

const newsCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      // ── Obligatorios ──────────────────────────────────────
      title: z.string(),
      slug: z.string(),
      date: z.date(),
      author: z.string(),
      excerpt: z.string().max(300),

      // ── Imagen ────────────────────────────────────────────
      image: image().refine((img) => img.width >= 720, {
        message: 'La imagen debe tener al menos 720 px de ancho.',
      }),

      // ── Categoría (enum cerrado) ──────────────────────────
      category: z.enum(categoryEnum),

      // ── Tags (opcional, con validación de formato) ────────
      tags: z
        .array(z.string().min(2).max(30))
        .max(10)
        .optional()
        .default([]),

      // ── Estado editorial ──────────────────────────────────
      draft: z.boolean().default(true),

      // ── SEO (opcional, override del excerpt) ──────────────
      metaDescription: z.string().max(320).optional(),

      // ── Canonical URL personalizada (opcional) ────────────
      canonicalURL: z.string().url().optional(),
    }),
});

export const collections = { news: newsCollection };
```

### Tipos derivados (opcional, `src/types/news.ts`)

```ts
import type { InferEntrySchema } from 'astro:content';

export type NewsArticle = InferEntrySchema<'news'>;
export type NewsCategory = (typeof categoryEnum)[number];
```

---

## 2. Flujo Editorial: Crear y Publicar un Artículo

### 2.1 — Crear el archivo

Cada artículo es un archivo `.mdx` dentro de `src/content/news/`.  
**Convención de nombrado:** `{slug}.mdx` (kebab-case).

```
src/content/news/
├── lanzamiento-elden-ring-shadow.mdx
├── review-baldurs-gate-3-patch-7.mdx
├── eventos-e3-2026.mdx
├── ofertas-black-friday.mdx
└── industria-tendencias-2026.mdx
```

### 2.2 — Frontmatter (borrador)

```mdx
---
title: "Análisis: Baldur's Gate 3 — Parche 7"
slug: "review-baldurs-gate-3-patch-7"
date: 2026-06-10
author: "Carlos Méndez"
category: "review"
image: "../../assets/news/bg3-patch-7-hero.jpg"
excerpt: "Larian Studios despliega el parche 7 con nuevas subclases, mejoras tácticas y un editor de mods oficial. Probamos cada novedad."
tags:
  - "baldurs-gate-3"
  - "larian-studios"
  - "rpg"
  - "parche"
draft: true
metaDescription: "Análisis completo del Parche 7 de Baldur's Gate 3: nuevas subclases, editor de mods oficial y mejoras tácticas."
canonicalURL: "https://007-sama.com/news/review-baldurs-gate-3-patch-7"
---

## Introducción

El Parche 7 de Baldur's Gate 3 ya está disponible…
```

### 2.3 — Flujo de revisión → publicación

| Paso | Acción | Estado `draft` |
|------|--------|:---:|
| 1 | El autor crea el `.mdx` con `draft: true` | `true` |
| 2 | Borrador visible en `localhost:4321/news/preview?slug=...` | `true` |
| 3 | Se envía a revisión (PR en Git) | `true` |
| 4 | Aprobado → se cambia a `draft: false` | `false` |
| 5 | Se mergea a `main` → build → publicación | `false` |

**Importante:** Con `draft: true` los artículos **no** se incluyen en el build de producción.  
Astro los omite automáticamente al llamar a `getCollection()`.

### 2.4 — Vista previa en desarrollo

```astro
---
// src/pages/news/preview.astro
import { getEntry } from 'astro:content';

const slug = Astro.url.searchParams.get('slug');
if (!slug) return Astro.redirect('/404');

const article = await getEntry('news', slug);
if (!article) return Astro.redirect('/404');

const { Content } = await article.render();
---
<BaseLayout title={article.data.title}>
  <article class="prose max-w-3xl mx-auto">
    <Content />
  </article>
</BaseLayout>
```

---

## 3. Filtrado y Ordenación

### 3.1 — Obtener artículos publicados (helper)

```ts
// src/lib/news.ts
import { getCollection } from 'astro:content';
import type { NewsCategory } from '@/types/news';

export async function getPublishedArticles() {
  return await getCollection('news', ({ data }) => !data.draft);
}

export async function getArticlesByCategory(category: NewsCategory) {
  return await getCollection(
    'news',
    ({ data }) => !data.draft && data.category === category,
  );
}
```

### 3.2 — Ordenar por fecha (más reciente primero)

```ts
const articles = await getPublishedArticles();

articles.sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime(),
);
```

Inline en componente:

```astro
---
import { getCollection } from 'astro:content';

const news = (await getCollection('news', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
```

### 3.3 — Filtro por tags

```ts
export async function getArticlesByTag(tag: string) {
  const all = await getPublishedArticles();
  return all
    .filter((a) => a.data.tags?.includes(tag))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
```

### 3.4 — Páginas de listado por categoría y tag

```astro
---
// src/pages/news/category/[category].astro
import { getCollection } from 'astro:content';
import type { GetStaticPathsOptions } from 'astro';

const categoryEnum = ['lanzamientos', 'review', 'eventos', 'ofertas', 'industria', 'tutoriales', 'opinion'] as const;

export async function getStaticPaths() {
  const articles = await getCollection('news', ({ data }) => !data.draft);
  const categories = [...new Set(articles.map((a) => a.data.category))];

  return categories.map((cat) => ({
    params: { category: cat },
    props: { category: cat },
  }));
}

const { category } = Astro.props;
const articles = (await getCollection('news', ({ data }) => !data.draft && data.category === category))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
```

```astro
---
// src/pages/news/tag/[tag].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const articles = await getCollection('news', ({ data }) => !data.draft);
  const tags = [...new Set(articles.flatMap((a) => a.data.tags ?? []))];

  return tags.map((tag) => ({
    params: { tag },
    props: { tag },
  }));
}

const { tag } = Astro.props;
const articles = (await getCollection('news', ({ data }) => !data.draft && (data.tags ?? []).includes(tag)))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
```

---

## 4. Generación de Páginas Estáticas con `getStaticPaths`

### 4.1 — Ruta de listado (`/news`)

```astro
---
// src/pages/news/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '@/layouts/BaseLayout.astro';
import NewsCard from '@/components/news/NewsCard.astro';

const articles = (await getCollection('news', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---

<BaseLayout title="Noticias" description="Últimas noticias, reviews y lanzamientos de videojuegos.">
  <section class="news-grid">
    {articles.map((article) => <NewsCard article={article} />)}
  </section>
</BaseLayout>
```

### 4.2 — Ruta de detalle (`/news/[slug]`)

```astro
---
// src/pages/news/[slug].astro
import { getCollection, getEntry } from 'astro:content';
import BaseLayout from '@/layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const articles = await getCollection('news', ({ data }) => !data.draft);
  return articles.map((article) => ({
    params: { slug: article.data.slug },
    props: { article },
  }));
}

const { article } = Astro.props;
const { Content } = await article.render();

const { title, date, author, category, excerpt, image, tags, metaDescription } = article.data;
---

<BaseLayout title={title} description={metaDescription ?? excerpt}>
  <article itemscope itemtype="https://schema.org/Article">
    <meta itemprop="datePublished" content={date.toISOString()} />
    <meta itemprop="author" content={author} />

    <img src={image.src} alt={title} width={image.width} height={image.height} />

    <div class="article-meta">
      <time datetime={date.toISOString()}>
        {date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </time>
      <span>por {author}</span>
      <span class="category-badge">{category}</span>
    </div>

    {tags && tags.length > 0 && (
      <ul class="tags">
        {tags.map((tag) => <li><a href={`/news/tag/${tag}`}>#{tag}</a></li>)}
      </ul>
    )}

    <div class="prose max-w-none">
      <Content />
    </div>
  </article>
</BaseLayout>
```

### 4.3 — Árbol de rutas generado

```
┌─────────────────────────────────────┬──────────────────────────────────────┐
│ Archivo                             │ Ruta generada                       │
├─────────────────────────────────────┼──────────────────────────────────────┤
│ src/pages/news/index.astro          │ /news                                │
│ src/pages/news/[slug].astro         │ /news/review-baldurs-gate-3-patch-7  │
│ src/pages/news/category/[cat].astro │ /news/category/review                │
│ src/pages/news/tag/[tag].astro      │ /news/tag/baldurs-gate-3             │
│ src/pages/news/preview.astro        │ /news/preview?slug=...               │
│ src/pages/news/feed.xml.ts          │ /news/feed.xml (RSS)                 │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 5. Componente NewsCard y Artículo Completo con MDX

### 5.1 — Componente `NewsCard.astro`

```astro
---
// src/components/news/NewsCard.astro
import type { CollectionEntry } from 'astro:content';

export interface Props {
  article: CollectionEntry<'news'>;
  variant?: 'default' | 'compact' | 'featured';
}

const { article, variant = 'default' } = Astro.props;
const { title, slug, date, category, excerpt, image, tags } = article.data;

const categoryLabels: Record<string, string> = {
  lanzamientos: 'Lanzamientos',
  review: 'Review',
  eventos: 'Eventos',
  ofertas: 'Ofertas',
  industria: 'Industria',
  tutoriales: 'Tutoriales',
  opinion: 'Opinión',
};
---

<article class={`news-card news-card--${variant}`}>
  <a href={`/news/${slug}`} class="news-card__link">
    {image && (
      <img
        src={image.src}
        alt={title}
        width={image.width}
        height={image.height}
        loading="lazy"
        class="news-card__image"
      />
    )}

    <div class="news-card__body">
      <div class="news-card__meta">
        <time datetime={date.toISOString()}>
          {date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </time>
        <span class="news-card__category">{categoryLabels[category] ?? category}</span>
      </div>

      <h2 class="news-card__title">{title}</h2>
      <p class="news-card__excerpt">{excerpt}</p>

      {tags && tags.length > 0 && (
        <ul class="news-card__tags">
          {tags.slice(0, 3).map((tag) => <li>#{tag}</li>)}
        </ul>
      )}
    </div>
  </a>
</article>

<style>
  .news-card {
    border-radius: 0.75rem;
    overflow: hidden;
    background: var(--color-surface);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .news-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  .news-card__link {
    text-decoration: none;
    color: inherit;
    display: block;
  }
  .news-card__image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  .news-card--featured .news-card__image {
    height: 400px;
  }
  .news-card--compact .news-card__image {
    height: 140px;
  }
  .news-card__body {
    padding: 1rem;
  }
  .news-card__meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: var(--color-muted);
    margin-bottom: 0.5rem;
  }
  .news-card__category {
    background: var(--color-primary);
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .news-card__title {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0 0 0.5rem;
  }
  .news-card__excerpt {
    color: var(--color-muted);
    font-size: 0.9375rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .news-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    list-style: none;
    padding: 0;
    margin: 0.75rem 0 0;
    font-size: 0.8125rem;
    color: var(--color-secondary);
  }
  .news-card--compact .news-card__title {
    font-size: 1rem;
  }
  .news-card--compact .news-card__excerpt {
    display: none;
  }
</style>
```

### 5.2 — Grilla de noticias (`NewsGrid.astro`)

```astro
---
// src/components/news/NewsGrid.astro
import type { CollectionEntry } from 'astro:content';
import NewsCard from './NewsCard.astro';

export interface Props {
  articles: CollectionEntry<'news'>[];
  columns?: 2 | 3 | 4;
}

const { articles, columns = 3 } = Astro.props;
---

<section class={`news-grid news-grid--cols-${columns}`}>
  {articles.length > 0 ? (
    articles.map((article, i) => (
      <NewsCard article={article} variant={i === 0 && columns < 4 ? 'featured' : 'default'} />
    ))
  ) : (
    <p class="news-grid__empty">No hay artículos disponibles.</p>
  )}
</section>

<style>
  .news-grid {
    display: grid;
    gap: 1.5rem;
  }
  .news-grid--cols-2 { grid-template-columns: repeat(2, 1fr); }
  .news-grid--cols-3 { grid-template-columns: repeat(3, 1fr); }
  .news-grid--cols-4 { grid-template-columns: repeat(4, 1fr); }
  .news-grid__empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: var(--color-muted);
  }
</style>
```

### 5.3 — Ejemplo de artículo MDX completo

```mdx
---
title: "Lanzamiento: Elden Ring — Shadow of the Erdtree ya disponible"
slug: "lanzamiento-elden-ring-shadow"
date: 2026-06-01
author: "Ana Torres"
category: "lanzamientos"
image: "../../assets/news/elden-ring-shadow-hero.jpg"
excerpt: "La esperada expansión de Elden Ring ya está a la venta. Nuevas armas, jefes y una nueva región para explorar."
tags:
  - "elden-ring"
  - "fromsoftware"
  - "expansion"
  - "shadow-of-the-erdtree"
draft: false
---

import ImageComparison from '@/components/news/ImageComparison.astro';
import { YouTube } from '@/components/ui/YouTube.astro';

## Un nuevo reino nos espera

Desde hoy, **Shadow of the Erdtree**, la expansión de Elden Ring, ya está disponible en todas las plataformas. FromSoftware entrega contenido que promete superar las expectativas.

<YouTube id="qLZenOn7WUo" />

### Novedades principales

- **Nueva región:** El Reino de las Sombras, un área del tamaño de Limgrave.
- **8 nuevos jefes principales**, incluyendo al temido *Messmer the Impaler*.
- **Más de 30 nuevas armas**, incluyendo dagas, espadas y martillos.
- **Nuevas clases de hechizos** y encantamientos.

<ImageComparison
  before="../../assets/news/elden-ring-base.jpg"
  after="../../assets/news/elden-ring-shadow-comparison.jpg"
  caption="Comparativa gráfica entre el juego base y la expansión"
/>

### Precio y disponibilidad

| Edición | Precio | Contenido |
|---------|--------|-----------|
| Standard | $39.99 | Expansión base |
| Deluxe | $59.99 | + Artbook digital + Banda sonora |
| Collector's | $199.99 | + Estatua de Messmer (40 cm) |

> **Disponible en:** PC, PS5, Xbox Series X|S  
> **Requiere:** Elden Ring (juego base)

### Veredicto temprano

Nuestras primeras 10 horas de juego nos muestran una expansión que rivaliza con el contenido del juego original. La dificultad es implacable incluso para veteranos. **Calificación preliminar: 9.5/10** — análisis completo próximamente.
```

---

## 6. RSS Feed de Noticias

### `src/pages/news/feed.xml.ts`

```ts
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const articles = (await getCollection('news', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, 20);

  const siteUrl = site ?? 'https://007-sama.com';

  const items = articles
    .map(
      (article) => `
    <item>
      <title><![CDATA[${article.data.title}]]></title>
      <link>${siteUrl}/news/${article.data.slug}</link>
      <guid isPermaLink="true">${siteUrl}/news/${article.data.slug}</guid>
      <description><![CDATA[${article.data.excerpt}]]></description>
      <pubDate>${article.data.date.toUTCString()}</pubDate>
      <dc:creator><![CDATA[${article.data.author}]]></dc:creator>
      <category>${article.data.category}</category>
      ${(article.data.tags ?? [])
        .map((tag) => `<category>${tag}</category>`)
        .join('\n      ')}
    </item>`,
    )
    .join('\n');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>007-Sama — Noticias</title>
    <link>${siteUrl}/news</link>
    <description>Últimas noticias, reviews y lanzamientos de videojuegos</description>
    <language>es-mx</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/news/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
```

### Referencia en `<head>`

```astro
<link rel="alternate" type="application/rss+xml" title="007-Sama — Noticias" href="/news/feed.xml" />
```

---

## 7. SEO: Open Graph, Meta Description, Structured Data

### 7.1 — Layout con SEO completo (`NewsLayout.astro`)

```astro
---
// src/layouts/NewsLayout.astro
import BaseLayout from './BaseLayout.astro';

export interface Props {
  title: string;
  description: string;
  image?: { src: string; width: number; height: number };
  article?: {
    slug: string;
    date: Date;
    author: string;
    category: string;
    tags?: string[];
  };
  canonicalURL?: string;
}

const { title, description, image, article, canonicalURL } = Astro.props;
const siteUrl = Astro.site ?? 'https://007-sama.com';
---

<BaseLayout title={title} description={description} canonicalURL={canonicalURL}>
  <!-- ── Open Graph ─────────────────────────────────── -->
  <meta property="og:type" content={article ? 'article' : 'website'} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:site_name" content="007-Sama" />
  <meta property="og:locale" content="es_MX" />

  {image && (
    <>
      <meta property="og:image" content={new URL(image.src, siteUrl).href} />
      <meta property="og:image:width" content={String(image.width)} />
      <meta property="og:image:height" content={String(image.height)} />
    </>
  )}

  {canonicalURL && <link rel="canonical" href={canonicalURL} />}

  <!-- ── Twitter Cards ──────────────────────────────── -->
  <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  {image && <meta name="twitter:image" content={new URL(image.src, siteUrl).href} />}

  <!-- ── Article: Open Graph adicional ──────────────── -->
  {article && (
    <>
      <meta property="article:published_time" content={article.date.toISOString()} />
      <meta property="article:author" content={article.author} />
      <meta property="article:section" content={article.category} />
      {article.tags?.map((tag) => <meta property="article:tag" content={tag} />)}
    </>
  )}

  <!-- ── Structured Data (JSON-LD) ──────────────────── -->
  <script type="application/ld+json" set:html={JSON.stringify({
    '@context': 'https://schema.org',
    '@type': article ? 'Article' : 'CollectionPage',
    ...(article
      ? {
          headline: title,
          description,
          image: image ? new URL(image.src, siteUrl).href : undefined,
          datePublished: article.date.toISOString(),
          dateModified: article.date.toISOString(),
          author: {
            '@type': 'Person',
            name: article.author,
          },
          publisher: {
            '@type': 'Organization',
            name: '007-Sama',
            url: siteUrl,
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalURL ?? `${siteUrl}/news/${article.slug}`,
          },
          articleSection: article.category,
          keywords: article.tags?.join(', '),
        }
      : {
          name: title,
          description,
        }),
  }, null, 2)} />

  <slot />
</BaseLayout>
```

### 7.2 — Breadcrumbs con structured data

```astro
---
// src/components/news/Breadcrumbs.astro
export interface Props {
  items: { label: string; href?: string }[];
}

const { items } = Astro.props;
---

<nav aria-label="Breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    {items.map((item, i) => (
      <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        {item.href ? (
          <a itemprop="item" href={item.href}>
            <span itemprop="name">{item.label}</span>
          </a>
        ) : (
          <span itemprop="name">{item.label}</span>
        )}
        <meta itemprop="position" content={String(i + 1)} />
      </li>
    ))}
  </ol>
</nav>
```

Uso en `[slug].astro`:

```astro
<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/' },
    { label: 'Noticias', href: '/news' },
    { label: article.data.title },
  ]}
/>
```

### 7.3 — Sitemap

Con `@astrojs/sitemap` en `astro.config.mjs` las rutas de noticias se incluyen automáticamente. Para personalizar:

```js
// astro.config.mjs
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://007-sama.com',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/preview'),
    }),
  ],
});
```

---

## Apéndice A: Checklist de publicación

- [ ] Frontmatter completo (`title`, `slug`, `date`, `author`, `category`, `image`, `excerpt`)
- [ ] Imagen ≥ 720 px de ancho
- [ ] `metaDescription` personalizada (opcional, mejora CTR en Google)
- [ ] Tags relevantes (2–5, en kebab-case)
- [ ] `draft: false` antes de mergear a `main`
- [ ] Contenido MDX verificado con `astro check`
- [ ] Enlace en `src/pages/news/index.astro` confirmado
- [ ] Imagen OG generada (1200×630 px recomendado)

## Apéndice B: Comandos útiles

```bash
# Type-check del proyecto (valida frontmatter y MDX)
pnpm astro check

# Sincronizar types de Content Collections (genera .astro/types.d.ts)
pnpm astro sync

# Build de producción
pnpm build

# Vista previa local del build
pnpm preview
```
