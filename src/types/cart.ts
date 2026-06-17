export interface CartItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  platform: string;
}

export interface CartSummary {
  items: CartItem[];
  count: number;
  subtotal: number;
  total: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  status: 'completed' | 'pending' | 'refunded';
}
