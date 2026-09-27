import { getProductById } from '@/lib/api';
import Link from 'next/link';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  return (
    <main className="min-h-screen p-8">
      <Link href="/" className="text-sm text-blue-400 hover:underline">
        ← Retour au catalogue
      </Link>

      <div className="mt-6 max-w-2xl">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-gray-500 mt-1">{product.category?.name}</p>

        <div className="mt-4">
          {product.promoPrice ? (
            <>
              <span className="text-2xl text-red-600 font-bold">
                {product.promoPrice} €
              </span>
              <span className="text-gray-400 line-through ml-3">
                {product.price} €
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold">{product.price} €</span>
          )}
        </div>

        {product.description && (
          <p className="mt-4 text-gray-300">{product.description}</p>
        )}

        <p className="mt-4 text-sm">
          SKU : {product.sku} · Stock disponible : {product.stock}
        </p>

        {product.sizes?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold mb-1">Tailles disponibles</p>
            <div className="flex gap-2">
              {product.sizes.map((size: string) => (
                <span key={size} className="border rounded px-3 py-1 text-sm">
                  {size}
                </span>
              ))}
            </div>
          </div>
        )}

        <button className="mt-6 bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 transition">
          Ajouter au panier
        </button>
      </div>
    </main>
  );
}