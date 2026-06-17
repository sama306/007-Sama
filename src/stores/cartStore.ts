import { atom, computed, onMount } from 'nanostores'
import type { CartItem } from '@/types/cart'

const CART_STORAGE_KEY = '007-sama-cart'

export const cartItems = atom<CartItem[]>([])
export const isCartOpen = atom(false)

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) return JSON.parse(stored) as CartItem[]
  } catch {}
  return []
}

function saveCart(items: readonly CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

onMount(cartItems, () => {
  cartItems.set(loadCart())
  const unsub = cartItems.subscribe((items) => {
    saveCart(items)
  })
  return unsub
})

export const cartCount = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0),
)

export const cartSubtotal = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0),
)

export const cartTotal = cartSubtotal

export function addToCart(item: Omit<CartItem, 'quantity'>): void {
  const current = cartItems.get()
  const existing = current.find((i) => i.id === item.id)
  if (existing) {
    cartItems.set(current.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)))
  } else {
    cartItems.set([...current, { ...item, quantity: 1 }])
  }
  isCartOpen.set(true)
}

export function removeFromCart(id: string): void {
  cartItems.set(cartItems.get().filter((item) => item.id !== id))
}

export function updateQuantity(id: string, quantity: number): void {
  if (quantity <= 0) {
    removeFromCart(id)
    return
  }
  cartItems.set(cartItems.get().map((item) => (item.id === id ? { ...item, quantity } : item)))
}

export function clearCart(): void {
  cartItems.set([])
}

export function toggleCart(): void {
  isCartOpen.set(!isCartOpen.get())
}
