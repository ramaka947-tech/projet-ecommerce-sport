'use client';

import { useCart } from '@/lib/cart-context';
import { useState } from 'react';

type Props = {
  productId: string;
  name: string;
  price: number;
  stock: number;
};

export default function AddToCartButton({ productId, name, price, stock }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    addItem({ productId, name, price, stock }, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={stock === 0}
      className="mt-6 bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {stock === 0 ? 'Rupture de stock' : added ? '✓ Ajouté au panier' : 'Ajouter au panier'}
    </button>
  );
}