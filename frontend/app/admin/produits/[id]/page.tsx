'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminGuard from '@/lib/admin-guard';
import { getCategories, getProductById } from '@/lib/api';
import ProductForm from '../product-form';

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCategories(), getProductById(id)]).then(
      ([cats, prod]) => {
        setCategories(cats);
        setProduct(prod);
        setLoading(false);
      },
    );
  }, [id]);

  return (
    <AdminGuard>
      <h1 className="text-3xl font-bold mb-8">Modifier le produit</h1>
      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <ProductForm categories={categories} product={product} />
      )}
    </AdminGuard>
  );
}