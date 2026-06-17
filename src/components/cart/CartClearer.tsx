import { useEffect } from 'react';
import { clearCart } from '@stores/cartStore';

export default function CartClearer() {
  useEffect(() => {
    clearCart();
  }, []);

  return null;
}
