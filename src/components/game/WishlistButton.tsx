import { useState, useCallback, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { currentUserId } from '@stores/authStore'
import { isInWishlist, addToWishlist, removeFromWishlist } from '@stores/wishlistStore'
import { addToast } from '@stores/toastStore'

interface Props {
  slug: string
  userId: string
  title?: string
  variant?: 'icon' | 'text'
}

export default function WishlistButton({
  slug,
  userId: propUserId,
  title,
  variant = 'icon',
}: Props) {
  const storeUserId = useStore(currentUserId)
  const effectiveUserId = propUserId !== 'guest' ? propUserId : storeUserId
  const [active, setActive] = useState(() => isInWishlist(effectiveUserId, slug))
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    setActive(isInWishlist(effectiveUserId, slug))
  }, [effectiveUserId, slug])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (animating) return
      setAnimating(true)
      if (active) {
        removeFromWishlist(effectiveUserId, slug)
        setActive(false)
        addToast('info', 'Eliminado de tu lista de deseos')
      } else {
        addToWishlist(effectiveUserId, slug)
        setActive(true)
        addToast('success', 'Agregado a tu lista de deseos ♥')
      }
      setTimeout(() => setAnimating(false), 300)
    },
    [slug, effectiveUserId, active, animating],
  )

  if (variant === 'text') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all ${
          active
            ? 'border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]'
            : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[#ef4444]/30 hover:text-[#ef4444]'
        }`}
        title={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        style={{
          transform: animating ? 'scale(1.3)' : 'scale(1)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <span style={{ color: '#ef4444' }}>{active ? '♥' : '♡'}</span>
        {active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-all ${
        active
          ? 'bg-[#ef4444] text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
          : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
      }`}
      aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      title={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      style={{
        transform: animating ? 'scale(1.3)' : 'scale(1)',
        transition: 'transform 0.3s ease-out',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{active ? '♥' : '♡'}</span>
    </button>
  )
}
