import Link from 'next/link';
import { getProducts } from '@/lib/api';

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Catalogue produits</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">Aucun produit disponible.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <Link
              key={product.id}
              href={`/produit/${product.id}`}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition block"
            >
              <h2 className="font-semibold text-lg">{product.name}</h2>
              <p className="text-sm text-gray-500">{product.category?.name}</p>
              <div className="mt-2">
                {product.promoPrice ? (
                  <>
                    <span className="text-red-600 font-bold">
                      {product.promoPrice} €
                    </span>
                    <span className="text-gray-400 line-through ml-2">
                      {product.price} €
                    </span>
                  </>
                ) : (
                  <span className="font-bold">{product.price} €</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Stock : {product.stock}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}