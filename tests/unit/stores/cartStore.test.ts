import { describe, it, expect, beforeEach } from 'vitest';
import { cartItems, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen } from '@/stores/cartStore';
import type { CartItem } from '@/types/cart';

const mockItem: Omit<CartItem, 'quantity'> = {
  id: 'game-1',
  slug: 'game-1',
  title: 'Test Game',
  price: 29.99,
  image: '/test.jpg',
  platform: 'pc',
};

const mockItem2: Omit<CartItem, 'quantity'> = {
  id: 'game-2',
  slug: 'game-2',
  title: 'Test Game 2',
  price: 49.99,
  image: '/test2.jpg',
  platform: 'ps5',
};

beforeEach(() => {
  localStorage.clear();
  cartItems.set([]);
  isCartOpen.set(false);
});

describe('addToCart', () => {
  it('agrega un item nuevo al carrito cuando no existe', () => {
    addToCart(mockItem);
    expect(cartItems.get()).toHaveLength(1);
    expect(cartItems.get()[0].id).toBe('game-1');
    expect(cartItems.get()[0].quantity).toBe(1);
  });

  it('incrementa quantity en 1 si el item ya existe', () => {
    addToCart(mockItem);
    addToCart(mockItem);
    expect(cartItems.get()).toHaveLength(1);
    expect(cartItems.get()[0].quantity).toBe(2);
  });

  it('no crea duplicados', () => {
    addToCart(mockItem);
    addToCart(mockItem);
    addToCart(mockItem);
    const ids = cartItems.get().map((i) => i.id);
    expect(new Set(ids).size).toBe(1);
  });
});

describe('removeFromCart', () => {
  it('elimina el item con el id correcto', () => {
    addToCart(mockItem);
    addToCart(mockItem2);
    removeFromCart('game-1');
    expect(cartItems.get()).toHaveLength(1);
    expect(cartItems.get()[0].id).toBe('game-2');
  });

  it('no modifica el array si el id no existe', () => {
    addToCart(mockItem);
    removeFromCart('non-existent');
    expect(cartItems.get()).toHaveLength(1);
  });
});

describe('updateQuantity', () => {
  it('actualiza la cantidad correctamente', () => {
    addToCart(mockItem);
    updateQuantity('game-1', 5);
    expect(cartItems.get()[0].quantity).toBe(5);
  });

  it('elimina el item si la cantidad es 0', () => {
    addToCart(mockItem);
    updateQuantity('game-1', 0);
    expect(cartItems.get()).toHaveLength(0);
  });

  it('no modifica nada si la cantidad es negativa', () => {
    addToCart(mockItem);
    updateQuantity('game-1', -3);
    expect(cartItems.get()).toHaveLength(0);
  });
});

describe('clearCart', () => {
  it('vacia el array completamente', () => {
    addToCart(mockItem);
    addToCart(mockItem2);
    clearCart();
    expect(cartItems.get()).toHaveLength(0);
  });
});

describe('cartCount', () => {
  it('retorna la suma de todas las quantities', () => {
    addToCart(mockItem);
    addToCart(mockItem);
    addToCart(mockItem2);
    expect(cartCount.get()).toBe(3);
  });

  it('retorna 0 si el carrito esta vacio', () => {
    expect(cartCount.get()).toBe(0);
  });
});

describe('cartTotal', () => {
  it('retorna price * quantity sumado de todos los items', () => {
    addToCart(mockItem);
    addToCart(mockItem2);
    addToCart(mockItem2);
    const expected = (29.99 * 1) + (49.99 * 2);
    expect(cartTotal.get()).toBeCloseTo(expected, 2);
  });

  it('retorna 0 si el carrito esta vacio', () => {
    expect(cartTotal.get()).toBe(0);
  });
});

describe('persistencia en localStorage', () => {
  it('guarda los cambios en localStorage', () => {
    addToCart(mockItem);
    const stored = JSON.parse(localStorage.getItem('007-sama-cart')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('game-1');
  });
});
