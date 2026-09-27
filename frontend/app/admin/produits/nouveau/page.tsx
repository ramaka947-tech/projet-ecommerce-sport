'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import { getCategories } from '@/lib/api';
import ProductForm from '../product-form';

export default function NewProductPage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  return (
    <AdminGuard>
      <h1 className="text-3xl font-bold mb-8">Nouveau produit</h1>
      <ProductForm categories={categories} />
    </AdminGuard>
  );
}