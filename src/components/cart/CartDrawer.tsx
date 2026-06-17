import { useStore } from '@nanostores/react'
import {
  cartItems,
  cartSubtotal,
  isCartOpen,
  removeFromCart,
  updateQuantity,
  toggleCart,
} from '@stores/cartStore'
import { addToast } from '@stores/toastStore'

export default function CartDrawer() {
  const items = useStore(cartItems)
  const subtotal = useStore(cartSubtotal)
  const open = useStore(isCartOpen)

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={toggleCart}
      />

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Carrito</h2>
          <button
            onClick={toggleCart}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
            aria-label="Cerrar carrito"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--color-text-muted)]"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p className="text-sm text-[var(--color-text-muted)]">Tu carrito está vacío</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 px-5 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-secondary)]">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-1.5 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)]">{item.platform}</p>
                      </div>
                      <button
                        onClick={() => {
                          removeFromCart(item.id)
                          addToast('info', 'Producto eliminado')
                        }}
                        className="shrink-0 rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-error)]"
                        aria-label={`Eliminar ${item.title}`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
                        >
                          -
                        </button>
                        <span className="flex h-6 w-8 items-center justify-center text-sm font-medium text-[var(--color-text-primary)]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[var(--color-border)] px-5 py-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Subtotal</span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <p className="mb-4 text-xs text-[var(--color-text-muted)]">
              Proyecto portfolio — sin pagos reales
            </p>
            <a
              href="/checkout"
              className="btn-primary flex w-full items-center justify-center rounded-lg bg-[var(--color-accent-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)]"
            >
              Ir al checkout
            </a>
          </div>
        )}
      </div>
    </>
  )
}
