import { getToken, logout } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ------------------------------------------------------------------ */
/*  Helper admin : ajoute le token, et déconnecte si l'API répond 401  */
/* ------------------------------------------------------------------ */
export async function authFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers);

  // JSON par défaut, sauf pour FormData (le navigateur gère le Content-Type)
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers,
  });

  if (res.status === 401) {
    logout();
    throw new Error('Session expirée, veuillez vous reconnecter.');
  }
  return res;
}

/* ------------------------------ Public ----------------------------- */

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

export async function getSizes() {
  const res = await fetch(`${API_URL}/sizes`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sizes');
  return res.json();
}

export async function getColors() {
  const res = await fetch(`${API_URL}/colors`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch colors');
  return res.json();
}

export async function getBrands() {
  const res = await fetch(`${API_URL}/brands`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch brands');
  return res.json();
}

export async function getHeroMedia() {
  const res = await fetch(`${API_URL}/hero-media`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch hero media');
  return res.json();
}

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

export async function getPaymentMethods() {
  const res = await fetch(`${API_URL}/payment-methods`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch payment methods');
  return res.json();
}

export async function sendContactMessage(data: {
  name: string;
  email: string;
  subject?: string;
  content: string;
  customerId?: string;
}) {
  const res = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Échec de l'envoi du message");
  return res.json();
}

/* ------------------- Suivi public (sans compte) -------------------- */

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

/* --------------------- Client connecté (customer) ------------------- */
/* Ces fonctions utilisent customer_token, pas le token admin.          */

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

/* ------------------------------ ADMIN ------------------------------ */
/* Tout passe par authFetch : token + déconnexion automatique sur 401. */

// ---- Stats ----
export async function getStats(period: string = '30d') {
  const res = await authFetch(`/stats?period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

// ---- Produits ----
export async function getAdminProducts() {
  const res = await authFetch('/products/admin/list');
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function createProduct(data: any) {
  const res = await authFetch('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function updateProduct(id: string, data: any) {
  const res = await authFetch(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteProduct(id: string) {
  const res = await authFetch(`/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

// ---- Catégories ----
export async function createCategory(data: any) {
  const res = await authFetch('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

export async function updateCategory(id: string, data: any) {
  const res = await authFetch(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update category');
  return res.json();
}

export async function deleteCategory(id: string) {
  const res = await authFetch(`/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
  return res.json();
}

// ---- Commandes ----
export async function getOrders() {
  const res = await authFetch('/orders');
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await authFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

// ---- Paramètres ----
export async function updateSettings(data: Record<string, string>) {
  const res = await authFetch('/settings', {
    method: 'PUT',
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

// ---- Upload ----
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await authFetch('/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

export async function uploadVideo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await authFetch('/upload/video', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

// ---- Tailles ----
export async function createSize(name: string) {
  const res = await authFetch('/sizes', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create size');
  return res.json();
}

export async function deleteSize(id: string) {
  const res = await authFetch(`/sizes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete size');
  return res.json();
}

// ---- Couleurs ----
export async function createColor(name: string, hex?: string) {
  const res = await authFetch('/colors', {
    method: 'POST',
    body: JSON.stringify({ name, hex }),
  });
  if (!res.ok) throw new Error('Failed to create color');
  return res.json();
}

export async function deleteColor(id: string) {
  const res = await authFetch(`/colors/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete color');
  return res.json();
}

// ---- Marques ----
export async function createBrand(name: string) {
  const res = await authFetch('/brands', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create brand');
  return res.json();
}

export async function deleteBrand(id: string) {
  const res = await authFetch(`/brands/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete brand');
  return res.json();
}

// ---- Hero Media ----
export async function getAllHeroMedia() {
  const res = await authFetch('/hero-media/all');
  if (!res.ok) throw new Error('Failed to fetch hero media');
  return res.json();
}

export async function createHeroMedia(data: { type: string; url: string }) {
  const res = await authFetch('/hero-media', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create hero media');
  return res.json();
}

export async function updateHeroMedia(
  id: string,
  data: { url?: string; isActive?: boolean; position?: number },
) {
  const res = await authFetch(`/hero-media/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update hero media');
  return res.json();
}

export async function deleteHeroMedia(id: string) {
  const res = await authFetch(`/hero-media/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete hero media');
  return res.json();
}

// ---- Avis (admin) ----
export async function getReviewsAdmin() {
  const res = await authFetch('/reviews');
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function approveReview(id: string) {
  const res = await authFetch(`/reviews/${id}/approve`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to approve review');
  return res.json();
}

export async function deleteReview(id: string) {
  const res = await authFetch(`/reviews/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete review');
  return res.json();
}

// ---- Moyens de paiement (admin) ----
export async function getAllPaymentMethods() {
  const res = await authFetch('/payment-methods/all');
  if (!res.ok) throw new Error('Failed to fetch payment methods');
  return res.json();
}

export async function createPaymentMethod(data: {
  name: string;
  instructions?: string;
  isActive?: boolean;
  position?: number;
}) {
  const res = await authFetch('/payment-methods', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create payment method');
  return res.json();
}

export async function updatePaymentMethod(
  id: string,
  data: { name?: string; instructions?: string; isActive?: boolean; position?: number },
) {
  const res = await authFetch(`/payment-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update payment method');
  return res.json();
}

export async function deletePaymentMethod(id: string) {
  const res = await authFetch(`/payment-methods/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete payment method');
  return res.json();
}

// ---- Messages contact (admin) ----
export async function getAdminMessages() {
  const res = await authFetch('/messages');
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function markMessageAsRead(id: string) {
  const res = await authFetch(`/messages/${id}/read`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to update message');
  return res.json();
}

export async function deleteMessage(id: string) {
  const res = await authFetch(`/messages/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete message');
  return res.json();
}

export async function replyMessage(id: string, reply: string) {
  const res = await authFetch(`/messages/${id}/reply`, {
    method: 'PATCH',
    body: JSON.stringify({ reply }),
  });
  if (!res.ok) throw new Error('Failed to reply');
  return res.json();
}

// ---- Administrateurs ----
export async function getAdmins() {
  const res = await authFetch('/auth/admins');
  if (!res.ok) throw new Error('Failed to fetch admins');
  return res.json();
}

export async function createAdmin(data: { name: string; email: string; password: string }) {
  const res = await authFetch('/auth/admins', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create admin');
  }
  return res.json();
}

export async function deleteAdmin(id: string) {
  const res = await authFetch(`/auth/admins/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete admin');
  }
  return res.json();
}