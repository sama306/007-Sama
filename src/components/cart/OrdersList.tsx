import { useState, useEffect, useCallback } from 'react';
import { getOrders } from '@stores/ordersStore';
import type { Order } from '@/types/cart';

interface Props {
  userId: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completado', color: '#22c55e' },
  pending: { label: 'Pendiente', color: '#f59e0b' },
  refunded: { label: 'Reembolsado', color: '#ef4444' },
};

function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Productos</h4>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-secondary)]">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" width="64" height="64" loading="lazy" decoding="async" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{item.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {item.platform} &times;{item.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-[var(--color-text-primary)]">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-2 rounded-lg bg-[var(--color-bg-secondary)] p-4 text-sm">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Resumen</h4>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Subtotal</span>
            <span className="font-medium text-[var(--color-text-primary)]">${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">IVA (21%)</span>
            <span className="font-medium text-[var(--color-text-primary)]">${(order.total - order.subtotal).toFixed(2)}</span>
          </div>
          <hr className="border-[var(--color-border)]" />
          <div className="flex justify-between text-base">
            <span className="font-semibold text-[var(--color-text-primary)]">Total</span>
            <span className="font-bold text-[var(--color-accent-neon)]">${order.total.toFixed(2)}</span>
          </div>
          <div className="pt-2">
            <p className="text-xs text-[var(--color-text-muted)]">ID de sesión: <span className="font-mono">{order.id}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersList({ userId }: Props) {
  const [allOrders, setAllOrders] = useState<Order[]>(() => getOrders(userId));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pdfStates, setPdfStates] = useState<Record<string, 'idle' | 'generating' | 'downloaded'>>({});

  const handleDownload = useCallback(async (order: Order) => {
    const id = order.id;
    setPdfStates((prev) => ({ ...prev, [id]: 'generating' }));
    try {
      const { generateOrderPDF } = await import('@lib/pdf');
      generateOrderPDF(order);
      setPdfStates((prev) => ({ ...prev, [id]: 'downloaded' }));
      setTimeout(() => {
        setPdfStates((prev) => ({ ...prev, [id]: 'idle' }));
      }, 1500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setPdfStates((prev) => ({ ...prev, [id]: 'idle' }));
    }
  }, []);

  useEffect(() => {
    setAllOrders(getOrders(userId));
  }, [userId]);

  if (allOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-6 text-[var(--color-text-muted)]">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <p className="mb-2 text-lg font-medium text-[var(--color-text-primary)]">Todavía no realizaste ningún pedido</p>
        <p className="mb-8 text-sm text-[var(--color-text-muted)]">Completá una compra para ver tus pedidos aquí.</p>
        <a href="/games" className="rounded-lg bg-[var(--color-accent-primary)] px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-accent-secondary)] hover:shadow-[0_0_20px_var(--color-accent-glow)]">
          Explorar catálogo
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
        Mis pedidos ({allOrders.length} {allOrders.length === 1 ? 'pedido' : 'pedidos'})
      </h2>

      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
              <th className="pb-3 font-medium">N° Pedido</th>
              <th className="pb-3 font-medium">Fecha</th>
              <th className="pb-3 font-medium">Items</th>
              <th className="pb-3 font-medium">Total</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {allOrders.map((order) => (
              <>
                <tr
                  key={order.id}
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="cursor-pointer transition-colors hover:bg-[var(--color-bg-elevated)]"
                >
                  <td className="py-4 font-mono text-xs text-[var(--color-text-primary)]">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="py-4 text-[var(--color-text-secondary)]">
                    {new Date(order.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-4 text-[var(--color-text-secondary)] max-w-[200px] truncate">
                    {order.items.map((i) => i.title).join(', ')}
                  </td>
                  <td className="py-4 font-semibold text-[var(--color-text-primary)]">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="py-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${statusConfig[order.status]?.color ?? '#94a3b8'}20`,
                        color: statusConfig[order.status]?.color ?? '#94a3b8',
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: statusConfig[order.status]?.color ?? '#94a3b8' }}
                      />
                      {statusConfig[order.status]?.label ?? order.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(order); }}
                        disabled={pdfStates[order.id] !== undefined && pdfStates[order.id] !== 'idle'}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-accent-primary)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent-primary)] transition-all hover:bg-[var(--color-accent-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pdfStates[order.id] === 'generating' ? (
                          <>Generando&hellip;</>
                        ) : pdfStates[order.id] === 'downloaded' ? (
                          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Descargado</>
                        ) : (
                          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>Descargar PDF</>
                        )}
                      </button>
                      <svg
                        className="h-4 w-4 text-[var(--color-text-muted)] transition-transform"
                        style={{ transform: expandedId === order.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </td>
                </tr>
                {expandedId === order.id && (
                  <tr key={`${order.id}-detail`}>
                    <td colSpan={7} className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                      <OrderDetail order={order} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {allOrders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-all"
          >
            <button
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div className="space-y-1">
                <p className="text-xs font-mono text-[var(--color-text-muted)]">
                  #{order.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  ${order.total.toFixed(2)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(order.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${statusConfig[order.status]?.color ?? '#94a3b8'}20`,
                      color: statusConfig[order.status]?.color ?? '#94a3b8',
                    }}
                  >
                    {statusConfig[order.status]?.label ?? order.status}
                  </span>
                </div>
              </div>
              <svg
                className="h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-transform"
                style={{ transform: expandedId === order.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expandedId === order.id && (
              <div className="border-t border-[var(--color-border)]">
                <OrderDetail order={order} />
                <div className="border-t border-[var(--color-border)] px-4 py-3">
                  <button
                    onClick={() => handleDownload(order)}
                    disabled={pdfStates[order.id] !== undefined && pdfStates[order.id] !== 'idle'}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-accent-primary)] px-4 py-2.5 text-sm font-medium text-[var(--color-accent-primary)] transition-all hover:bg-[var(--color-accent-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pdfStates[order.id] === 'generating' ? (
                      <>Generando&hellip;</>
                    ) : pdfStates[order.id] === 'downloaded' ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Descargado</>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Descargar PDF</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
