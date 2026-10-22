'use client';

import { useEffect, useRef, useState } from 'react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { useCart, CartItem } from '@/lib/cart-context';
import { useFavorites, FavoriteProduct } from '@/lib/favorites-context';
import { getSavedData, saveSavedData } from '@/lib/api';

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function validCart(list: any): CartItem[] {
  return Array.isArray(list)
    ? list.filter(
        (i) =>
          i &&
          typeof i.id === 'string' &&
          typeof i.productId === 'string' &&
          Number(i.quantity) > 0,
      )
    : [];
}

function validFavs(list: any): FavoriteProduct[] {
  return Array.isArray(list) ? list.filter((f) => f && typeof f.id === 'string') : [];
}

// Fusion de deux paniers : on garde toutes les lignes, la plus grande quantité l'emporte
function mergeCart(local: CartItem[], saved: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const item of [...local, ...saved]) {
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      continue;
    }
    const qty = Math.max(prev.quantity, item.quantity);
    map.set(item.id, { ...prev, quantity: prev.stock > 0 ? Math.min(prev.stock, qty) : qty });
  }
  return Array.from(map.values());
}

// Fusion de deux listes de favoris, sans doublon
function mergeFavs(local: FavoriteProduct[], saved: FavoriteProduct[]): FavoriteProduct[] {
  const map = new Map<string, FavoriteProduct>();
  for (const f of [...local, ...saved]) {
    if (!map.has(f.id)) map.set(f.id, f);
  }
  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Composant (n'affiche rien) : à placer une seule fois dans le layout
// ---------------------------------------------------------------------------

export default function SavedDataSync() {
  const { customer } = useCustomerAuth();
  const { items, loaded: cartLoaded, replaceItems } = useCart();
  const { favorites, loaded: favLoaded, replaceFavorites } = useFavorites();

  const ready = cartLoaded && favLoaded;
  const customerId: string | null = customer?.id ?? null;

  // Client pour lequel la première synchro est terminée
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const startedLoggedIn = useRef<boolean | null>(null);
  const firstSyncDone = useRef(false);
  const prevCustomerId = useRef<string | null>(null);

  // 1) Au chargement ou à la connexion : on récupère ce qui est enregistré sur le compte
  useEffect(() => {
    if (!ready) return;
    if (startedLoggedIn.current === null) startedLoggedIn.current = !!customerId;
    if (!customerId || syncedFor === customerId) return;

    let cancelled = false;
    getSavedData()
      .then((saved) => {
        if (cancelled) return;
        const savedCart = validCart(saved.cart);
        const savedFavs = validFavs(saved.favorites);

        // Retour sur le site avec une session déjà ouverte : le compte fait foi
        // (sauf s'il est vide : on garde alors ce qu'il y a sur l'appareil).
        // Connexion pendant la visite : on fusionne l'appareil et le compte.
        const restore = startedLoggedIn.current === true && !firstSyncDone.current;
        if (restore) {
          replaceItems((prev) => (savedCart.length > 0 ? savedCart : prev));
          replaceFavorites((prev) => (savedFavs.length > 0 ? savedFavs : prev));
        } else {
          replaceItems((prev) => mergeCart(prev, savedCart));
          replaceFavorites((prev) => mergeFavs(prev, savedFavs));
        }
        firstSyncDone.current = true;
        setSyncedFor(customerId);
      })
      .catch(() => {
        // Réseau coupé : on ne sauvegarde rien pour ne pas écraser le compte
      });

    return () => {
      cancelled = true;
    };
  }, [ready, customerId, syncedFor]);

  // 2) Ensuite : chaque modification est sauvegardée sur le compte (après 0,8 s de calme)
  useEffect(() => {
    if (!ready || !customerId || syncedFor !== customerId) return;
    const timer = setTimeout(() => {
      saveSavedData({ cart: items, favorites }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [items, favorites, ready, customerId, syncedFor]);

  // 3) Déconnexion : on vide l'appareil (les données restent sur le compte)
  useEffect(() => {
    if (!ready) return;
    if (prevCustomerId.current && !customerId) {
      replaceItems([]);
      replaceFavorites([]);
      setSyncedFor(null);
      startedLoggedIn.current = false;
      firstSyncDone.current = false;
    }
    prevCustomerId.current = customerId;
  }, [ready, customerId]);

  return null;
}