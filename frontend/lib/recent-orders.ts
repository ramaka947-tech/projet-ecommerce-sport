// Petit carnet de commandes gardé sur l'appareil (simple confort).
// Le vrai suivi repose toujours sur : numéro de commande + téléphone.

const KEY = 'recent-orders';

export type RecentOrder = { orderNumber: string; phone: string; date: number };

export function getRecentOrders(): RecentOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberOrder(orderNumber: string, phone: string) {
  try {
    const list = getRecentOrders().filter((o) => o.orderNumber !== orderNumber);
    list.unshift({ orderNumber, phone, date: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 10)));
  } catch {}
}

export function trackingUrl(orderNumber: string, phone: string) {
  return `/suivi?n=${encodeURIComponent(orderNumber)}&t=${encodeURIComponent(phone)}`;
}