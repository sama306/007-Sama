export interface SearchGame {
  title: string;
  slug: string;
  description: string;
  genre: string;
  platform: string[];
  price: number;
  discount: number;
  rating: number;
  tags: string[];
  developer: string;
  image: string;
}

export const fuseKeys = [
  { name: 'title', weight: 4 },
  { name: 'description', weight: 2 },
  { name: 'tags', weight: 3 },
  { name: 'developer', weight: 1 },
  { name: 'genre', weight: 1 },
] as const;

export const fuseOptions = {
  keys: fuseKeys,
  threshold: 0.4,
  distance: 200,
  includeScore: true,
  minMatchCharLength: 2,
} as const;
