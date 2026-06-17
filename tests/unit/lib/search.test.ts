import { describe, it, expect } from 'vitest';
import Fuse from 'fuse.js';
import { fuseOptions } from '@/lib/search';
import type { SearchGame } from '@/lib/search';

const mockGames: SearchGame[] = [
  {
    title: 'Elden Ring',
    slug: 'elden-ring',
    description: 'Un RPG de accion en un mundo abierto',
    genre: 'rpg',
    platform: ['pc', 'ps5', 'xbox-series-x'],
    price: 59.99,
    discount: 0,
    rating: 4.8,
    tags: ['rpg', 'mundo-abierto', 'fantasia'],
    developer: 'FromSoftware',
    image: '/elden-ring.jpg',
  },
  {
    title: 'Cyberpunk 2077',
    slug: 'cyberpunk-2077',
    description: 'RPG de mundo abierto en Night City',
    genre: 'rpg',
    platform: ['pc', 'ps5', 'xbox-series-x'],
    price: 49.99,
    discount: 20,
    rating: 4.5,
    tags: ['rpg', 'mundo-abierto', 'ciberpunk'],
    developer: 'CD Projekt Red',
    image: '/cyberpunk-2077.jpg',
  },
  {
    title: 'FIFA 24',
    slug: 'fifa-24',
    description: 'Simulacion de futbol',
    genre: 'sports',
    platform: ['pc', 'ps5', 'xbox-series-x', 'switch'],
    price: 69.99,
    discount: 0,
    rating: 3.5,
    tags: ['deportes', 'futbol', 'simulacion'],
    developer: 'EA Sports',
    image: '/fifa-24.jpg',
  },
  {
    title: 'Hollow Knight',
    slug: 'hollow-knight',
    description: 'Un metroidvania en un mundo subterraneo',
    genre: 'action',
    platform: ['pc', 'ps5', 'switch'],
    price: 14.99,
    discount: 0,
    rating: 4.9,
    tags: ['metroidvania', 'accion', 'plataformas'],
    developer: 'Team Cherry',
    image: '/hollow-knight.jpg',
  },
  {
    title: 'Age of Empires IV',
    slug: 'age-of-empires-iv',
    description: 'Estrategia en tiempo real',
    genre: 'strategy',
    platform: ['pc'],
    price: 39.99,
    discount: 10,
    rating: 4.2,
    tags: ['estrategia', 'historia', 'rts'],
    developer: 'Relic Entertainment',
    image: '/age-of-empires-iv.jpg',
  },
];

function search(query: string): SearchGame[] {
  if (!query) return mockGames;
  const fuse = new Fuse(mockGames, fuseOptions);
  return fuse.search(query).map((r) => r.item);
}

describe('busqueda con Fuse.js', () => {
  it('busqueda exacta por titulo retorna el juego correcto', () => {
    const results = search('Elden Ring');
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('elden-ring');
  });

  it('busqueda parcial retorna resultados relevantes', () => {
    const results = search('Ring');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((g) => g.slug === 'elden-ring')).toBe(true);
  });

  it('busqueda con typo menor retorna resultados (fuzzy)', () => {
    const results = search('Elden Rng');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe('elden-ring');
  });

  it('busqueda sin coincidencias retorna array vacio', () => {
    const results = search('zzzzzxyqwerty');
    expect(results).toHaveLength(0);
  });

  it('query vacio retorna todos los juegos', () => {
    const results = search('');
    expect(results).toEqual(mockGames);
  });

  it('los resultados estan ordenados por score de relevancia', () => {
    const fuse = new Fuse(mockGames, fuseOptions);
    const results = fuse.search('rpg');
    expect(results.length).toBeGreaterThan(1);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeLessThanOrEqual(results[i].score!);
    }
  });

  it('busqueda por genero retorna juegos del genero correcto', () => {
    const results = search('estrategia');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((g) => g.slug === 'age-of-empires-iv')).toBe(true);
  });

  it('busqueda por desarrollador retorna juegos correctos', () => {
    const results = search('FromSoftware');
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('elden-ring');
  });
});
