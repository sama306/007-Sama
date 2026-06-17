import { useEffect } from 'react';
import { addOrder } from '@stores/ordersStore';
import { clearCart } from '@stores/cartStore';
import type { CartItem, Order } from '@/types/cart';

interface Props {
  sessionId: string;
  total: number;
  items: string;
  date: string;
  userId: string;
}

export default function SaveOrder({ sessionId, total, items, date, userId }: Props) {
  useEffect(() => {
    const parsedItems: CartItem[] = JSON.parse(items);
    const subtotal = parsedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order: Order = {
      id: sessionId,
      date,
      items: parsedItems,
      subtotal,
      total,
      status: 'completed',
    };

    addOrder(userId, order);
    clearCart();
  }, [sessionId, total, items, date, userId]);

  return null;
}
