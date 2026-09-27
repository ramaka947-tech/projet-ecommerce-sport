const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getProducts() {
  const res = await fetch(`${API_URL}/products`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function getCategories() {
  const res = await fetch(`${API_URL}/categories`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getSettings() {
  const res = await fetch(`${API_URL}/settings`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function getProductById(id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function createOrder(orderData: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  comment?: string;
  paymentMethod: string;
  deliveryFee?: number;
  items: { productId: string; quantity: number }[];
}) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create order');
  }
  return res.json();
}

export async function getOrderById(id: string) {
  const res = await fetch(`${API_URL}/orders/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json();
}