import type { Order } from '@/types/cart';

// En producción reemplazar localStorage por consultas a DB usando el userId
// para que los datos persistan entre dispositivos

export function getOrdersKey(userId: string): string {
  return `orders:${userId}`;
}

export function getOrders(userId: string): Order[] {
  try {
    const stored = localStorage.getItem(getOrdersKey(userId));
    if (stored) return JSON.parse(stored) as Order[];
  } catch {}
  return [];
}

export function saveOrders(userId: string, items: Order[]): void {
  try {
    localStorage.setItem(getOrdersKey(userId), JSON.stringify(items));
  } catch {}
}

export function addOrder(userId: string, order: Order): void {
  const current = getOrders(userId);
  if (!current.some((o) => o.id === order.id)) {
    saveOrders(userId, [order, ...current]);
  }
}

export function clearOrders(userId: string): void {
  saveOrders(userId, []);
}

export function migrateGuestOrders(userId: string): void {
  if (userId === 'guest') return;
  const guestItems = getOrders('guest');
  if (guestItems.length === 0) return;

  const userItems = getOrders(userId);
  const existingIds = new Set(userItems.map((o) => o.id));
  const merged = [...guestItems.filter((o) => !existingIds.has(o.id)), ...userItems];
  saveOrders(userId, merged);
  saveOrders('guest', []);
}
