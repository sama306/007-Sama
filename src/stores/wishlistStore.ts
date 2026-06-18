export function getWishlistKey(userId: string): string {
  return `wishlist:${userId}`
}

export function getWishlist(userId: string): string[] {
  try {
    const stored = localStorage.getItem(getWishlistKey(userId))
    if (stored) return JSON.parse(stored) as string[]
  } catch {}
  return []
}

export function saveWishlist(userId: string, items: string[]): void {
  try {
    localStorage.setItem(getWishlistKey(userId), JSON.stringify(items))
  } catch {}
}

export function addToWishlist(userId: string, slug: string): void {
  const current = getWishlist(userId)
  if (!current.includes(slug)) {
    saveWishlist(userId, [...current, slug])
  }
  if (userId !== 'guest') {
    fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', slug }),
    }).catch(() => {})
  }
}

export function removeFromWishlist(userId: string, slug: string): void {
  saveWishlist(
    userId,
    getWishlist(userId).filter((s) => s !== slug),
  )
  if (userId !== 'guest') {
    fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', slug }),
    }).catch(() => {})
  }
}

export function isInWishlist(userId: string, slug: string): boolean {
  return getWishlist(userId).includes(slug)
}

export function clearWishlist(userId: string): void {
  saveWishlist(userId, [])
}

export function migrateGuestWishlist(userId: string): void {
  if (userId === 'guest') return
  const guestItems = getWishlist('guest')
  if (guestItems.length === 0) return

  const userItems = getWishlist(userId)
  const merged = [...new Set([...userItems, ...guestItems])]
  saveWishlist(userId, merged)
  saveWishlist('guest', [])

  for (const slug of guestItems) {
    if (!userItems.includes(slug)) {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', slug }),
      }).catch(() => {})
    }
  }
}

export async function loadWishlistFromServer(userId: string): Promise<void> {
  if (userId === 'guest') return
  try {
    const res = await fetch('/api/wishlist')
    if (!res.ok) return
    const data = (await res.json()) as { slugs: string[] }
    if (!data.slugs) return

    const local = getWishlist(userId)
    const serverSlugs = data.slugs
    const merged = [...new Set([...serverSlugs, ...local])]
    saveWishlist(userId, merged)

    for (const slug of local) {
      if (!serverSlugs.includes(slug)) {
        fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', slug }),
        }).catch(() => {})
      }
    }
  } catch {}
}
