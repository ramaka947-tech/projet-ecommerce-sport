'use client';
import { useEffect, useState } from 'react';
import { Check, Trash2, Star } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { getReviewsAdmin, approveReview, deleteReview } from '@/lib/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getReviewsAdmin();
      setReviews(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    await approveReview(id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet avis ?')) return;
    await deleteReview(id);
    load();
  };

  const filtered = reviews.filter((r) => {
    if (filter === 'pending') return !r.isApproved;
    if (filter === 'approved') return r.isApproved;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <AdminGuard>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Avis clients</h1>
        <p className="text-sm text-ink/60 mt-1">
          {pendingCount > 0
            ? `${pendingCount} avis en attente de validation`
            : 'Aucun avis en attente'}
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-ink text-white'
                : 'bg-white border border-line hover:bg-canvas'
            }`}
          >
            {f === 'pending' ? 'En attente' : f === 'approved' ? 'Approuvés' : 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink/60">Chargement...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-line p-12 text-center">
          <p className="text-ink/60">Aucun avis.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-line p-5">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <p className="font-semibold">{r.authorName}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i <= r.rating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    {!r.isApproved ? (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        En attente
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Approuvé
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-ink/50 mb-2">
                    {r.product?.name} ·{' '}
                    {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  </p>

                  {r.comment && <p className="text-sm text-ink/80">{r.comment}</p>}
                </div>

                <div className="flex items-center gap-2">
                  {!r.isApproved && (
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      <Check size={16} />
                      Approuver
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    aria-label="Supprimer"
                    className="flex items-center gap-1.5 text-action border border-action/40 text-sm px-3 py-2 rounded-lg hover:bg-action hover:text-white transition"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}