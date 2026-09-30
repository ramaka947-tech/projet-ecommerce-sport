const KEY = 'customer_token';
const CUSTOMER_KEY = 'customer_data';

export function setCustomerSession(token: string, customer: any) {
  localStorage.setItem(KEY, token);
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
}

export function getCustomerToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}

export function getCustomer() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CUSTOMER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function removeCustomerSession() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(CUSTOMER_KEY);
}