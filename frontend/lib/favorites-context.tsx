'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// On garde une copie du produit pour pouvoir l'afficher dans la page favoris
export type FavoriteProduct = {
  id: string;
  name: string;
  price: number;
  promoPrice?: number | null;
  images?: string[];
  category?: { name: string } | null;
  stock?: number;
  colors?: any;
  sizes?: any;
};

type FavoritesContextType = {
  favorites: FavoriteProduct[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (product: FavoriteProduct) => void;
  removeFavorite: (id: string) => void;
  count: number;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);
const STORAGE_KEY = 'favorites-v2';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites, loaded]);

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  function toggleFavorite(product: FavoriteProduct) {
    setFavorites((prev) =>
      prev.some((f) => f.id === product.id)
        ? prev.filter((f) => f.id !== product.id)
        : [
            ...prev,
            {
              id: product.id,
              name: product.name,
              price: product.price,
              promoPrice: product.promoPrice,
              images: product.images,
              category: product.category,
              stock: product.stock,
              colors: product.colors,
              sizes: product.sizes,
            },
          ]
    );
  }

  function removeFavorite(id: string) {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, removeFavorite, count: favorites.length }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites doit être utilisé dans <FavoritesProvider>');
  return ctx;
}