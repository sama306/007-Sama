import { useEffect } from 'react';
import { cartItems } from '@stores/cartStore';
import { currentUserId } from '@stores/authStore';
import { migrateGuestWishlist } from '@stores/wishlistStore';
import { migrateGuestOrders } from '@stores/ordersStore';
import { addToast } from '@stores/toastStore';

const RECOVERED_FLAG = '007-sama-cart-recovered';

export default function AuthCartSync() {
  useEffect(() => {
    const flag = sessionStorage.getItem(RECOVERED_FLAG);
    if (flag) return;

    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if (!session || !session.user) return;

        const userId = session.user.id;
        if (!userId || userId === 'guest') return;

        currentUserId.set(userId);

        const items = cartItems.get();
        if (items.length > 0) {
          addToast('info', 'Tu carrito fue recuperado.');
          sessionStorage.setItem(RECOVERED_FLAG, 'true');
        }

        migrateGuestWishlist(userId);
        migrateGuestOrders(userId);
      } catch {
        /* noop */
      }
    })();
  }, []);

  return null;
}
