import { useState, useEffect } from 'react'
import { getWishlist, removeFromWishlist } from '@stores/wishlistStore'
import { addToast } from '@stores/toastStore'
import WishlistButton from '@components/game/WishlistButton'

interface GameData {
  slug: string
  title: string
  description: string
  price: number
  discount: number
  image: string
  rating: number
  platforms: string[]
  genre: string
}

interface Props {
  games: string
  userId: string
}

const platformLabels: Record<string, string> = {
  pc: 'PC',
  ps5: 'PS5',
  'xbox-series-x': 'X/S',
  switch: 'Switch',
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating)
  const empty = 5 - stars
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: stars }, (_, i) => (
        <svg
          key={i}
          className="h-3.5 w-3.5 text-[var(--color-accent-secondary)]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <svg
          key={i}
          className="h-3.5 w-3.5 text-[var(--color-border)]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-[var(--color-text-muted)]">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function WishlistItems({ games, userId }: Props) {
  const [slugs, setSlugs] = useState<string[]>(() => getWishlist(userId))
  const allGames: GameData[] = JSON.parse(games)
  const wishlistGames = allGames.filter((g) => slugs.includes(g.slug))

  useEffect(() => {
    setSlugs(getWishlist(userId))
  }, [userId])

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de que querés vaciar tu lista de deseos?')) {
      wishlistGames.forEach((g) => removeFromWishlist(userId, g.slug))
      setSlugs([])
      addToast('info', 'Lista de deseos vaciada')
    }
  }

  if (wishlistGames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-6 text-[var(--color-text-muted)]"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <p className="mb-2 text-lg font-medium text-[var(--color-text-primary)]">
          Todavía no agregaste juegos a tu lista de deseos
        </p>
        <p className="mb-8 text-sm text-[var(--color-text-muted)]">
          Explorá el catálogo y usá el corazón para guardar tus favoritos.
        </p>
        <a
          href="/games"
          className="rounded-lg bg-[var(--color-accent-primary)] px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)]"
        >
          Explorar catálogo
        </a>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Lista de deseos ({wishlistGames.length} {wishlistGames.length === 1 ? 'juego' : 'juegos'})
        </h1>
        <button
          onClick={handleClearAll}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
        >
          Vaciar lista
        </button>
      </div>

      <div className="stagger-children grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {wishlistGames.map((game) => {
          const discountedPrice =
            game.discount > 0 ? (game.price * (1 - game.discount / 100)).toFixed(2) : null

          return (
            <article
              key={game.slug}
              className="game-card card-hover group relative flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]"
            >
              <a href={`/games/${game.slug}`} className="flex flex-col">
                <div className="card-image-container relative aspect-[16/9] bg-[var(--color-bg-secondary)]">
                  {game.image && (
                    <img
                      src={game.image}
                      alt={game.title}
                      className="h-full w-full object-cover"
                      width="400"
                      height="225"
                      loading="lazy"
                      decoding="async"
                    />
                  )}

                  <WishlistButton slug={game.slug} userId={userId} title={game.title} />

                  {game.discount > 0 && (
                    <span className="absolute left-2 top-2 rounded bg-[var(--color-accent-primary)] px-2 py-0.5 text-xs font-bold text-white">
                      -{game.discount}%
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)] line-clamp-1">
                    {game.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                    {game.description}
                  </p>

                  <StarRating rating={game.rating} />

                  <div className="flex flex-wrap items-center gap-1.5">
                    {game.platforms.map((p) => (
                      <span
                        key={p}
                        className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--color-text-muted)]"
                      >
                        {platformLabels[p] ?? p}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-baseline gap-2">
                    {discountedPrice ? (
                      <>
                        <span className="text-lg font-bold text-[var(--color-accent-primary)]">
                          ${discountedPrice}
                        </span>
                        <span className="text-sm text-[var(--color-text-muted)] line-through">
                          ${game.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-[var(--color-text-primary)]">
                        ${game.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            </article>
          )
        })}
      </div>
    </div>
  )
}
