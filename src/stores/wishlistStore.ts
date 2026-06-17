// En producción reemplazar localStorage por consultas a DB usando el userId
// para que los datos persistan entre dispositivos

export function getWishlistKey(userId: string): string {
  return `wishlist:${userId}`;
}

export function getWishlist(userId: string): string[] {
  try {
    const stored = localStorage.getItem(getWishlistKey(userId));
    if (stored) return JSON.parse(stored) as string[];
  } catch {}
  return [];
}

export function saveWishlist(userId: string, items: string[]): void {
  try {
    localStorage.setItem(getWishlistKey(userId), JSON.stringify(items));
  } catch {}
}

export function addToWishlist(userId: string, slug: string): void {
  const current = getWishlist(userId);
  if (!current.includes(slug)) {
    saveWishlist(userId, [...current, slug]);
  }
}

export function removeFromWishlist(userId: string, slug: string): void {
  saveWishlist(
    userId,
    getWishlist(userId).filter((s) => s !== slug),
  );
}

export function isInWishlist(userId: string, slug: string): boolean {
  return getWishlist(userId).includes(slug);
}

export function clearWishlist(userId: string): void {
  saveWishlist(userId, []);
}

export function migrateGuestWishlist(userId: string): void {
  if (userId === 'guest') return;
  const guestItems = getWishlist('guest');
  if (guestItems.length === 0) return;

  const userItems = getWishlist(userId);
  const merged = [...new Set([...userItems, ...guestItems])];
  saveWishlist(userId, merged);
  saveWishlist('guest', []);
}
