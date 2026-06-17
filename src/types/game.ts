export const GENRES = ['action', 'rpg', 'strategy', 'adventure', 'simulation', 'sports', 'horror'] as const;
export type Genre = (typeof GENRES)[number];

export const PLATFORMS = ['pc', 'ps5', 'xbox-series-x', 'switch'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const GAME_STATUSES = ['published', 'draft'] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  platform: Platform[];
  genre: Genre;
  developer: string;
  publisher?: string;
  releaseDate: Date;
  images: string[];
  trailerUrl?: string;
  rating: number;
  featured: boolean;
  tags: string[];
  status: GameStatus;
}
