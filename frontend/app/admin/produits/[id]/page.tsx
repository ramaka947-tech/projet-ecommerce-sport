'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminGuard from '@/lib/admin-guard';
import { getCategories, getProductById } from '@/lib/api';
import { Loader2 } from 'lucide-react';
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
      <div className="mx-auto max-w-6xl">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-action" size={32} />
          </div>
        ) : (
          <ProductForm categories={categories} product={product} />
        )}
      </div>
    </AdminGuard>
  );
}