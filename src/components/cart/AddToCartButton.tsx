import { useStore } from '@nanostores/react'
import { addToCart, cartItems } from '@stores/cartStore'
import { addToast } from '@stores/toastStore'
import { useState, useEffect, useCallback } from 'react'

interface Props {
  id: string
  slug: string
  title: string
  price: number
  image: string
  platform: string
}

type ButtonState = 'idle' | 'loading' | 'added'

export default function AddToCartButton({ id, slug, title, price, image, platform }: Props) {
  const items = useStore(cartItems)
  const [state, setState] = useState<ButtonState>('idle')

  const alreadyInCart = items.some((item) => item.id === id)

  const handleClick = useCallback(() => {
    if (alreadyInCart) return
    setState('loading')
    setTimeout(() => {
      addToCart({ id, slug, title, price, image, platform })
      addToast('success', 'Agregado al carrito ✓')
      setState('added')
      setTimeout(() => setState('idle'), 1500)
    }, 300)
  }, [alreadyInCart, id, slug, title, price, image, platform])

  useEffect(() => {
    if (!alreadyInCart && state === 'added') {
      setState('idle')
    }
  }, [alreadyInCart, state])

  const buttonText = () => {
    if (alreadyInCart) return 'Agregado ✓'
    switch (state) {
      case 'loading':
        return (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Agregando...
          </span>
        )
      case 'added':
        return 'Agregado ✓'
      default:
        return 'Agregar al carrito'
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className={`w-full rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
        alreadyInCart
          ? 'border border-[var(--color-success)] bg-transparent text-[var(--color-success)]'
          : state === 'added'
            ? 'bg-[var(--color-success)] text-white'
            : 'btn-primary bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)]'
      }`}
    >
      {buttonText()}
    </button>
  )
}
