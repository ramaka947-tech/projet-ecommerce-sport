'use client';
import { useEffect, useState, useMemo } from 'react';
import { Star, Search, Check, Trash2, ThumbsUp, ThumbsDown, AlertCircle, Loader2 } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { getReviewsAdmin, approveReview, deleteReview } from '@/lib/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRating, setFilterRating] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getReviewsAdmin();
      setReviews(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    await approveReview(id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet avis ?')) return;
    await deleteReview(id);
    load();
  };

  const stats = useMemo(() => {
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = total > 0 ? (sum / total).toFixed(1) : '0.0';
    const positive = reviews.filter(r => r.rating >= 4).length;
    const negative = reviews.filter(r => r.rating <= 2).length;
    const distribution: number[] = [0, 0, 0, 0, 0];
    reviews.forEach(r => distribution[r.rating - 1]++);
    return { total, average, positive, negative, distribution };
  }, [reviews]);

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.authorName?.toLowerCase().includes(q) ||
      r.product?.name?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' ? true :
      filterStatus === 'approved' ? r.isApproved : !r.isApproved;
    const matchesRating = filterRating === 'all' ? true : r.rating === Number(filterRating);
    return matchesSearch && matchesStatus && matchesRating;
  });

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const selectCls =
    'min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm focus:border-action focus:outline-none md:min-h-0 md:w-auto md:py-2';

  return (
    <AdminGuard>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink md:text-2xl">Avis clients</h1>
        <p className="mt-1 text-sm text-ink/60">Découvrez ce que vos clients pensent de vos produits.</p>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4 md:space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 shadow-sm md:gap-3 md:p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-action text-white md:size-10"><Star size={18} fill="currentColor" /></div>
              <div className="min-w-0">
                <p className="text-base font-bold text-ink md:text-xl">{stats.average} / 5</p>
                <p className="truncate text-xs text-ink/50">Note moyenne</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 shadow-sm md:gap-3 md:p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-action/10 text-action md:size-10"><Star size={18} /></div>
              <div className="min-w-0">
                <p className="text-base font-bold text-ink md:text-xl">{stats.total}</p>
                <p className="truncate text-xs text-ink/50">Total des avis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 shadow-sm md:gap-3 md:p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-soft text-success md:size-10"><ThumbsUp size={18} /></div>
              <div className="min-w-0">
                <p className="text-base font-bold text-ink md:text-xl">{stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0}%</p>
                <p className="truncate text-xs text-ink/50">Avis positifs</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 shadow-sm md:gap-3 md:p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/50 md:size-10"><ThumbsDown size={18} /></div>
              <div className="min-w-0">
                <p className="text-base font-bold text-ink md:text-xl">{stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0}%</p>
                <p className="truncate text-xs text-ink/50">Avis négatifs</p>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3 shadow-sm md:flex-row md:flex-wrap md:items-center md:justify-between md:p-4">
            <div className="relative w-full md:min-w-[200px] md:flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Rechercher un client, un produit..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-line bg-canvas/30 pl-9 pr-3 text-base focus:border-action focus:outline-none md:min-h-0 md:py-2 md:text-sm"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
                <option value="all">Tous les avis</option>
                <option value="approved">Approuvés</option>
                <option value="pending">En attente</option>
              </select>
              <select value={filterRating} onChange={e => setFilterRating(e.target.value)} className={selectCls}>
                <option value="all">Toutes les notes</option>
                <option value="5">5 étoiles</option>
                <option value="4">4 étoiles</option>
                <option value="3">3 étoiles</option>
                <option value="2">2 étoiles</option>
                <option value="1">1 étoile</option>
              </select>
            </div>
          </div>

          {/* Liste : cartes mobile / tableau desktop */}
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            {loading ? (
              <div className="flex justify-center p-12 text-ink/50"><Loader2 className="animate-spin" size={24} /></div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-ink/50">Aucun avis trouvé.</div>
            ) : (
              <>
                {/* Mobile */}
                <ul className="divide-y divide-line md:hidden">
                  {filtered.map(r => (
                    <li key={r.id} className="p-4">
                      <div className="mb-2 flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                          {getInitials(r.authorName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{r.authorName}</p>
                          <p className="text-xs text-ink/50">{r.customerPhone}</p>
                        </div>
                        {r.isApproved ? (
                          <span className="shrink-0 rounded-md bg-success-soft px-2 py-1 text-xs font-bold text-success">Approuvé</span>
                        ) : (
                          <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">En attente</span>
                        )}
                      </div>

                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={12} className={i <= r.rating ? 'fill-yellow-500 text-yellow-500' : 'text-line'} />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-ink/60">{r.rating}/5</span>
                        {r.product?.images?.[0] && (
                          <img src={r.product.images[0]} className="ml-auto size-7 rounded object-cover" alt="" />
                        )}
                        <span className="max-w-[120px] truncate text-xs text-ink/60">{r.product?.name}</span>
                      </div>

                      <p className="line-clamp-3 text-sm text-ink/70">{r.comment}</p>
                      <p className="mt-1 text-[10px] text-ink/40">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        {!r.isApproved && (
                          <button onClick={() => handleApprove(r.id)} className="flex min-h-10 items-center gap-1.5 rounded-lg bg-success-soft px-3 text-sm font-semibold text-success transition hover:bg-success hover:text-white">
                            <Check size={16} /> Approuver
                          </button>
                        )}
                        <button onClick={() => handleDelete(r.id)} aria-label="Supprimer" className="flex size-10 items-center justify-center rounded-lg text-action transition hover:bg-action-soft">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Desktop */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line bg-canvas/50 text-xs uppercase tracking-wider text-ink/50">
                        <th className="px-6 py-4 font-semibold">Client</th>
                        <th className="px-6 py-4 font-semibold">Produit</th>
                        <th className="px-6 py-4 font-semibold">Note</th>
                        <th className="px-6 py-4 font-semibold">Commentaire</th>
                        <th className="px-6 py-4 font-semibold">Statut</th>
                        <th className="px-6 py-4 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filtered.map(r => (
                        <tr key={r.id} className="transition hover:bg-canvas/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{getInitials(r.authorName)}</div>
                              <div>
                                <p className="text-sm font-semibold text-ink">{r.authorName}</p>
                                <p className="text-xs text-ink/50">{r.customerPhone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {r.product?.images?.[0] ? (
                                <img src={r.product.images[0]} className="size-8 rounded object-cover" alt="" />
                              ) : (
                                <div className="size-8 rounded bg-canvas" />
                              )}
                              <span className="max-w-[120px] truncate text-sm font-medium text-ink">{r.product?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={12} className={i <= r.rating ? 'fill-yellow-500 text-yellow-500' : 'text-line'} />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-ink/60">{r.rating}/5</span>
                          </td>
                          <td className="max-w-[200px] px-6 py-4 text-sm text-ink/70">
                            <p className="line-clamp-2">{r.comment}</p>
                            <p className="mt-1 text-[10px] text-ink/40">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
                          </td>
                          <td className="px-6 py-4">
                            {r.isApproved ? (
                              <span className="inline-flex items-center rounded-md bg-success-soft px-2 py-1 text-xs font-bold text-success">Approuvé</span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">En attente</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {!r.isApproved && (
                                <button onClick={() => handleApprove(r.id)} className="rounded-lg p-1.5 text-success transition hover:bg-success-soft" title="Approuver">
                                  <Check size={16} />
                                </button>
                              )}
                              <button onClick={() => handleDelete(r.id)} className="rounded-lg p-1.5 text-action transition hover:bg-action-soft" title="Supprimer">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="min-w-0 space-y-4 md:space-y-6">
          <div className="rounded-xl border border-line bg-white p-4 shadow-sm md:p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-ink"><Star size={16} className="text-action" /> Répartition des avis</h3>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="relative size-20 shrink-0 rounded-full bg-canvas">
                <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90 transform">
                  <path className="text-action" strokeDasharray={`${(Number(stats.average) / 5) * 100}, 100`} stroke="currentColor" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold leading-none">{stats.average}</p>
                  <p className="text-[10px] text-ink/50">/ 5</p>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = stats.distribution[stars - 1] || 0;
                  const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2 text-xs">
                      <span className="w-12 shrink-0 font-medium text-ink/60">{stars} étoile{stars > 1 ? 's' : ''}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                        <div className="h-full bg-action" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-8 shrink-0 text-right font-semibold text-ink/50">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-action/20 bg-action-soft p-4">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-action" />
            <div>
              <h3 className="text-sm font-bold text-action">Avis vérifiés</h3>
              <p className="mt-1 text-xs text-ink/70">Tous les avis proviennent de clients ayant réellement passé commande sur votre boutique.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}