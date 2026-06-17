import { describe, it, expect, beforeEach } from 'vitest';
import { addToWishlist, removeFromWishlist, isInWishlist, getWishlist, clearWishlist, migrateGuestWishlist } from '@/stores/wishlistStore';

beforeEach(() => {
  localStorage.clear();
});

describe('addToWishlist', () => {
  it('agrega un slug a la lista del usuario', () => {
    addToWishlist('user-1', 'elden-ring');
    expect(getWishlist('user-1')).toEqual(['elden-ring']);
  });

  it('no agrega duplicados', () => {
    addToWishlist('user-1', 'elden-ring');
    addToWishlist('user-1', 'elden-ring');
    expect(getWishlist('user-1')).toEqual(['elden-ring']);
  });
});

describe('removeFromWishlist', () => {
  it('elimina el slug correcto', () => {
    addToWishlist('user-1', 'elden-ring');
    addToWishlist('user-1', 'cyberpunk-2077');
    removeFromWishlist('user-1', 'elden-ring');
    expect(getWishlist('user-1')).toEqual(['cyberpunk-2077']);
  });

  it('no modifica la lista si el slug no existe', () => {
    addToWishlist('user-1', 'elden-ring');
    removeFromWishlist('user-1', 'non-existent');
    expect(getWishlist('user-1')).toEqual(['elden-ring']);
  });
});

describe('isInWishlist', () => {
  it('retorna true si el slug esta en la lista', () => {
    addToWishlist('user-1', 'hollow-knight');
    expect(isInWishlist('user-1', 'hollow-knight')).toBe(true);
  });

  it('retorna false si el slug no esta en la lista', () => {
    expect(isInWishlist('user-1', 'non-existent')).toBe(false);
  });
});

describe('independencia entre usuarios', () => {
  it('getWishlist para userA y userB son independientes', () => {
    addToWishlist('userA', 'game-a');
    addToWishlist('userB', 'game-b');
    expect(getWishlist('userA')).toEqual(['game-a']);
    expect(getWishlist('userB')).toEqual(['game-b']);
  });
});

describe('persistencia en localStorage', () => {
  it('persiste los cambios bajo la key correcta', () => {
    addToWishlist('user-persist', 'witcher-3');
    const stored = JSON.parse(localStorage.getItem('wishlist:user-persist')!);
    expect(stored).toEqual(['witcher-3']);
  });
});

describe('clearWishlist', () => {
  it('vacia la wishlist del usuario', () => {
    addToWishlist('user-1', 'game-1');
    clearWishlist('user-1');
    expect(getWishlist('user-1')).toEqual([]);
  });
});

describe('migrateGuestWishlist', () => {
  it('migra items del guest al usuario y limpia guest', () => {
    addToWishlist('guest', 'elden-ring');
    addToWishlist('guest', 'hollow-knight');
    addToWishlist('user-final', 'cyberpunk-2077');
    migrateGuestWishlist('user-final');
    const userWishlist = getWishlist('user-final');
    expect(userWishlist).toContain('elden-ring');
    expect(userWishlist).toContain('hollow-knight');
    expect(userWishlist).toContain('cyberpunk-2077');
    expect(getWishlist('guest')).toEqual([]);
  });

  it('no hace nada si userId es guest', () => {
    migrateGuestWishlist('guest');
    expect(getWishlist('guest')).toEqual([]);
  });

  it('no hace nada si el guest no tiene items', () => {
    migrateGuestWishlist('user-empty');
    expect(getWishlist('user-empty')).toEqual([]);
  });
});
