import { useStore } from '@nanostores/react'
import { cartCount, toggleCart } from '@stores/cartStore'
import { useEffect, useState } from 'react'

export default function CartCounter() {
  const count = useStore(cartCount)
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    if (count === 0) return
    setBounce(true)
    const id = setTimeout(() => setBounce(false), 400)
    return () => clearTimeout(id)
  }, [count])

  return (
    <button
      onClick={toggleCart}
      className="relative flex items-center justify-center"
      aria-label={`Carrito, ${count} artículos`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span
          className={`absolute -right-2 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-[var(--color-accent-primary)] px-1 text-[11px] font-bold leading-[18px] text-white transition-transform ${
            bounce ? 'scale-125' : 'scale-100'
          }`}
          style={{ transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
