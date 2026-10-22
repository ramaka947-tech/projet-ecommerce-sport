'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getProductReviews, createReview } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

// "Awa Diop" -> "Awa D."   |   un numéro de téléphone -> "Client"
// Pour l'inverse (nom visible, prénom masqué), remplace le return final par :
//   return `${parts[0][0].toUpperCase()}. ${parts[parts.length - 1]}`;
function publicName(raw?: string) {
  if (!raw) return 'Client';
  const name = raw.trim();
  if (/^[+\d\s().-]{6,}$/.test(name)) return 'Client';
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const auth: any = useCustomerAuth();
  const isLoggedIn: boolean = !!auth.isLoggedIn;
  // Adapte si ton contexte appelle l'objet autrement (customer, user, me…)
  const customer = auth.customer ?? auth.user ?? null;
  const knownPhone: string = customer?.phone ?? '';
  const displayName = publicName(
    [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || customer?.name
  );

  const [data, setData] = useState<{ average: number; total: number; reviews: any[] }>({
    average: 0, total: 0, reviews: [],
  });
  const [form, setForm] = useState({ customerPhone: '', rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    getProductReviews(productId).then(setData).catch(() => {});
  };

  useEffect(() => {
    load();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await createReview({
        productId,
        rating: form.rating,
        comment: form.comment || undefined,
        customerPhone: knownPhone || form.customerPhone,
      });
      setMessage('Merci ! Votre avis sera publié après validation.');
      setForm({ customerPhone: '', rating: 5, comment: '' });
    } catch (err: any) {
      setMessage(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-12 pt-8 border-t max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Avis clients</h2>

      {/* Moyenne */}
      {data.total > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <Stars value={data.average} size={20} />
          <span className="font-semibold">{data.average}/5</span>
          <span className="text-sm text-gray-500">
            ({data.total} avis)
          </span>
        </div>
      )}

      {/* Liste */}
      {data.reviews.length === 0 ? (
        <p className="text-gray-500 text-sm mb-8">Aucun avis pour le moment.</p>
      ) : (
        <ul className="space-y-6 mb-10">
          {data.reviews.map((r) => (
            <li key={r.id} className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{publicName(r.authorName)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {/* Formulaire */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Laisser un avis</h3>

        {!isLoggedIn ? (
          <p className="text-sm text-gray-600">
            <Link href="/compte/connexion" className="font-semibold underline">
              Connectez-vous
            </Link>{' '}
            pour laisser un avis. Vous devez avoir reçu ce produit (commande livrée).
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-4">
              Vous devez avoir reçu ce produit (via une commande livrée) pour laisser un avis.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm">
                Publié sous le nom :{' '}
                <span className="font-semibold">{displayName}</span>
              </p>

              {/* Demandé seulement si le compte n'a pas de téléphone */}
              {!knownPhone && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Téléphone utilisé lors de la commande
                  </label>
                  <input
                    required
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="w-full border rounded px-3 py-2 bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Note</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setForm({ ...form, rating: i })}
                      className="p-1"
                    >
                      <Star
                        size={24}
                        className={i <= form.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  rows={3}
                  className="w-full border rounded px-3 py-2 bg-white"
                />
              </div>

              {message && <p className="text-sm text-blue-600">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Envoyer mon avis'}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}