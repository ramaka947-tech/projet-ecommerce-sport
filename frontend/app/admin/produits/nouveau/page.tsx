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
      <div className="max-w-6xl mx-auto">
        <ProductForm categories={categories} />
      </div>
    </AdminGuard>
  );
}