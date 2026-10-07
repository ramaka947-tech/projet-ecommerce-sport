'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type CartItem = {
  id: string; // identifiant de la ligne (produit + couleur + taille + note)
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  stock: number;
  color?: string;
  size?: string;
  note?: string;
};

type AddInput = Omit<CartItem, 'id' | 'quantity'> & { quantity?: number };

type CartContextType = {
  items: CartItem[];
  addItem: (input: AddInput) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = 'cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  function addItem(input: AddInput) {
    const qty = input.quantity ?? 1;
    const id = [input.productId, input.color || '', input.size || '', input.note || ''].join('|');

    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: Math.min(i.stock, i.quantity + qty) } : i
        );
      }
      return [...prev, { ...input, id, quantity: Math.min(input.stock, qty) }];
    });
  }

  function updateQuantity(id: string, quantity: number) {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(i.stock, quantity) } : i))
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, subtotal, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>');
  return ctx;
}