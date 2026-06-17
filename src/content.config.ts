import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const gamesCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/games' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().max(280),
    price: z.number().positive(),
    discount: z.number().min(0).max(100).default(0),
    platform: z.array(z.enum(['pc', 'ps5', 'xbox-series-x', 'switch'])),
    genre: z.enum([
      'action',
      'rpg',
      'strategy',
      'adventure',
      'simulation',
      'sports',
      'horror',
    ]),
    developer: z.string(),
    publisher: z.string().optional(),
    releaseDate: z.coerce.date(),
    images: z.array(z.string().url()),
    trailerUrl: z.string().url().optional(),
    rating: z.number().min(0).max(5).default(0),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    status: z.enum(['published', 'draft']).default('published'),
    stores: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url(),
        }),
      )
      .default([]),
    requirements: z
      .object({
        minimum: z.array(z.string()),
        recommended: z.array(z.string()).optional(),
      })
      .optional(),
  }),
});

const newsCollection = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    category: z.enum([
      'lanzamientos',
      'review',
      'eventos',
      'ofertas',
      'industria',
      'tutoriales',
      'opinion',
    ]),
    image: z.string().url(),
    imageAlt: z.string().default(''),
    excerpt: z.string().max(300),
    tags: z.array(z.string()).default([]),
    relatedGames: z.array(z.string()).default([]),
    status: z.enum(['published', 'draft']).default('draft'),
  }),
});

export const collections = { games: gamesCollection, news: newsCollection };
