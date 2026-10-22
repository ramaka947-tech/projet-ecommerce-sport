const API_URL = process.env.NEXT_PUBLIC_API_URL;
import { getToken } from '@/lib/auth';

export async function getProducts(filters: Record<string, string> = {}) {
  const qs = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_URL}/products${qs ? `?${qs}` : ''}`, {
    cache: 'no-store',
  });
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
  customerId?: string;
    items: { productId: string; quantity: number; size?: string; color?: string }[];
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

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Login failed');
  }
  return res.json();
}


function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function createProduct(data: any) {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function updateProduct(id: string, data: any) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

export async function createCategory(data: any) {
  const res = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

export async function updateCategory(id: string, data: any) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update category');
  return res.json();
}

export async function deleteCategory(id: string) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete category');
  return res.json();
}

export async function getOrders() {
  const res = await fetch(`${API_URL}/orders`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await fetch(`${API_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

export async function updateSettings(data: Record<string, string>) {
  const res = await fetch(`${API_URL}/settings`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      Array.isArray(err.message) ? err.message.join(', ') : err.message || 'Failed to update settings',
    );
  }
  return res.json();
}

export async function getStats(period: string = '30d') {
  const res = await fetch(`${API_URL}/stats?period=${period}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const token = getToken();
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

export async function getSizes() {
  const res = await fetch(`${API_URL}/sizes`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sizes');
  return res.json();
}

export async function createSize(name: string) {
  const res = await fetch(`${API_URL}/sizes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create size');
  return res.json();
}

export async function deleteSize(id: string) {
  const res = await fetch(`${API_URL}/sizes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete size');
  return res.json();
}

export async function getColors() {
  const res = await fetch(`${API_URL}/colors`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch colors');
  return res.json();
}

export async function createColor(name: string, hex?: string) {
  const res = await fetch(`${API_URL}/colors`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, hex }),
  });
  if (!res.ok) throw new Error('Failed to create color');
  return res.json();
}

export async function deleteColor(id: string) {
  const res = await fetch(`${API_URL}/colors/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete color');
  return res.json();
}

export async function registerCustomer(data: {
  name: string; email: string; password: string; phone: string;
  country?: string; region?: string; district?: string; address?: string;
}) {
  const res = await fetch(`${API_URL}/customer-auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Register failed');
  }
  return res.json();
}

export async function loginCustomer(email: string, password: string) {
  const res = await fetch(`${API_URL}/customer-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Login failed');
  }
  return res.json();
}

export async function getMeCustomer() {
  const token = localStorage.getItem('customer_token');
  const res = await fetch(`${API_URL}/customer-auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch customer');
  return res.json();
}

export async function updateMyProfile(data: {
  name?: string;
  phone?: string;
  region?: string;
  address?: string;
}) {
  const token = localStorage.getItem('customer_token');
  const res = await fetch(`${API_URL}/customer-auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      Array.isArray(err.message) ? err.message.join(', ') : err.message || "Impossible d'enregistrer",
    );
  }
  return res.json();
}

export async function getMyOrders() {
  const token = localStorage.getItem('customer_token');
  const res = await fetch(`${API_URL}/customer-auth/orders`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

// ---- Hero Media ----
export async function getHeroMedia() {
  const res = await fetch(`${API_URL}/hero-media`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch hero media');
  return res.json();
}

export async function getAllHeroMedia() {
  const res = await fetch(`${API_URL}/hero-media/all`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch hero media');
  return res.json();
}

export async function createHeroMedia(data: { type: string; url: string }) {
  const res = await fetch(`${API_URL}/hero-media`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create hero media');
  return res.json();
}

export async function updateHeroMedia(id: string, data: { url?: string; isActive?: boolean; position?: number }) {
  const res = await fetch(`${API_URL}/hero-media/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update hero media');
  return res.json();
}

export async function deleteHeroMedia(id: string) {
  const res = await fetch(`${API_URL}/hero-media/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete hero media');
  return res.json();
}

export async function uploadVideo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const token = getToken();
  const res = await fetch(`${API_URL}/upload/video`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

// ---- Reviews ----
export async function getProductReviews(productId: string) {
  const res = await fetch(`${API_URL}/reviews/product/${productId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function createReview(data: {
  productId: string;
  rating: number;
  comment?: string;
  customerPhone: string;
}) {
  const res = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create review');
  }
  return res.json();
}

export async function getReviewsAdmin() {
  const res = await fetch(`${API_URL}/reviews`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function approveReview(id: string) {
  const res = await fetch(`${API_URL}/reviews/${id}/approve`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to approve review');
  return res.json();
}

export async function deleteReview(id: string) {
  const res = await fetch(`${API_URL}/reviews/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete review');
  return res.json();
}

// ---- Payment methods ----
export async function getPaymentMethods() {
  const res = await fetch(`${API_URL}/payment-methods`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch payment methods');
  return res.json();
}

export async function getAllPaymentMethods() {
  const res = await fetch(`${API_URL}/payment-methods/all`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch payment methods');
  return res.json();
}

export async function createPaymentMethod(data: {
  name: string;
  instructions?: string;
  isActive?: boolean;
  position?: number;
}) {
  const res = await fetch(`${API_URL}/payment-methods`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create payment method');
  return res.json();
}

export async function updatePaymentMethod(
  id: string,
  data: { name?: string; instructions?: string; isActive?: boolean; position?: number },
) {
  const res = await fetch(`${API_URL}/payment-methods/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update payment method');
  return res.json();
}

export async function deletePaymentMethod(id: string) {
  const res = await fetch(`${API_URL}/payment-methods/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete payment method');
  return res.json();
}

// ---- Suivi de commande (côté client connecté) ----
export async function getMyOrder(id: string) {
  const token = localStorage.getItem('customer_token');
  const res = await fetch(`${API_URL}/customer-auth/orders/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Commande introuvable');
  return res.json();
}

export async function cancelMyOrder(id: string) {
  const token = localStorage.getItem('customer_token');
  const res = await fetch(`${API_URL}/customer-auth/orders/${id}/cancel`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Impossible d'annuler la commande");
  }
  return res.json();
}

// ---- Suivi public (sans compte) ----
export async function trackOrder(orderNumber: string, phone: string) {
  const res = await fetch(`${API_URL}/orders/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber, phone }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Commande introuvable');
  }
  return res.json();
}

export async function cancelTrackedOrder(orderNumber: string, phone: string) {
  const res = await fetch(`${API_URL}/orders/track/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber, phone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Impossible d'annuler la commande");
  }
  return res.json();
}

// ---- Panier + favoris enregistrés (client connecté) ----
export async function getSavedData() {
  const token = localStorage.getItem('customer_token');
  const res = await fetch(`${API_URL}/customer-auth/saved`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch saved data');
  return res.json();
}

export async function saveSavedData(data: { cart?: any[]; favorites?: any[] }) {
  const token = localStorage.getItem('customer_token');
  const res = await fetch(`${API_URL}/customer-auth/saved`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save data');
  return res.json();
}

export async function getBrands() {
  const res = await fetch(`${API_URL}/brands`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch brands');
  return res.json();
}

export async function createBrand(name: string) {
  const res = await fetch(`${API_URL}/brands`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create brand');
  return res.json();
}

export async function deleteBrand(id: string) {
  const res = await fetch(`${API_URL}/brands/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete brand');
  return res.json();
}

// ---- Messages Contact ----

export async function getAdminMessages() {
  const res = await fetch(`${API_URL}/messages`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function markMessageAsRead(id: string) {
  const res = await fetch(`${API_URL}/messages/${id}/read`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to update message');
  return res.json();
}

export async function deleteMessage(id: string) {
  const res = await fetch(`${API_URL}/messages/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete message');
  return res.json();
}

export async function replyMessage(id: string, reply: string) {
  const res = await fetch(`${API_URL}/messages/${id}/reply`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ reply }),
  });
  if (!res.ok) throw new Error('Failed to reply');
  return res.json();
}

export async function sendContactMessage(data: {
  name: string;
  email: string;
  subject?: string;
  content: string;
  customerId?: string; // <-- Ajoute cette ligne
}) {
  const res = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Échec de l'envoi du message");
  return res.json();
}

export async function getMyMessages() {
  const token = localStorage.getItem('customer_token');
  const res = await fetch(`${API_URL}/customer-auth/messages`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function addMyMessageEntry(messageId: string, content: string) {
  const token = localStorage.getItem('customer_token');
  const res = await fetch(`${API_URL}/customer-auth/messages/${messageId}/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Envoi impossible');
  return res.json();
}

