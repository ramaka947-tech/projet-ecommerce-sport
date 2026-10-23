'use client';
import { useEffect, useState, useMemo } from 'react';
import { Star, Search, Check, Trash2, MoreHorizontal, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { getReviewsAdmin, approveReview, deleteReview } from '@/lib/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, approved, pending
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

  // --- STATISTIQUES ---
  const stats = useMemo(() => {
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = total > 0 ? (sum / total).toFixed(1) : '0.0';
    const positive = reviews.filter(r => r.rating >= 4).length;
    const negative = reviews.filter(r => r.rating <= 2).length;
    
    // Répartition par étoiles
    const distribution: number[] = [0, 0, 0, 0, 0]; // 1 à 5
    reviews.forEach(r => distribution[r.rating - 1]++);

    return { total, average, positive, negative, distribution };
  }, [reviews]);

  // --- FILTRAGE ---
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

  return (
    <AdminGuard>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Avis clients</h1>
        <p className="text-sm text-ink/60 mt-1">Découvrez ce que vos clients pensent de vos produits.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        
        {/* COLONNE GAUCHE (Stats + Tableau) */}
        <div className="space-y-6">
          
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-action text-white flex items-center justify-center shrink-0"><Star size={20} fill="currentColor" /></div>
              <div>
                <p className="text-xl font-bold text-ink">{stats.average} / 5</p>
                <p className="text-xs text-ink/50">Note moyenne</p>
              </div>
            </div>
            <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-action/10 text-action flex items-center justify-center shrink-0"><Star size={20} /></div>
              <div>
                <p className="text-xl font-bold text-ink">{stats.total}</p>
                <p className="text-xs text-ink/50">Total des avis</p>
              </div>
            </div>
            <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success-soft text-success flex items-center justify-center shrink-0"><ThumbsUp size={20} /></div>
              <div>
                <p className="text-xl font-bold text-ink">{stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0}%</p>
                <p className="text-xs text-ink/50">Avis positifs</p>
              </div>
            </div>
            <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-canvas text-ink/50 flex items-center justify-center shrink-0"><ThumbsDown size={20} /></div>
              <div>
                <p className="text-xl font-bold text-ink">{stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0}%</p>
                <p className="text-xs text-ink/50">Avis négatifs</p>
              </div>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Rechercher un client, un produit..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-action bg-canvas/30"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="all">Tous les avis</option>
                <option value="approved">Approuvés</option>
                <option value="pending">En attente</option>
              </select>
              <select value={filterRating} onChange={e => setFilterRating(e.target.value)} className="border border-line rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="all">Toutes les notes</option>
                <option value="5">5 étoiles</option>
                <option value="4">4 étoiles</option>
                <option value="3">3 étoiles</option>
                <option value="2">2 étoiles</option>
                <option value="1">1 étoile</option>
              </select>
            </div>
          </div>

          {/* Tableau des avis */}
          <div className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-ink/50">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-ink/50">Aucun avis trouvé.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas/50 text-ink/50 text-xs uppercase tracking-wider border-b border-line">
                      <th className="px-6 py-4 font-semibold">Client</th>
                      <th className="px-6 py-4 font-semibold">Produit</th>
                      <th className="px-6 py-4 font-semibold">Note</th>
                      <th className="px-6 py-4 font-semibold">Commentaire</th>
                      <th className="px-6 py-4 font-semibold">Statut</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filtered.map(r => (
                      <tr key={r.id} className="hover:bg-canvas/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {getInitials(r.authorName)}
                            </div>
                            <div>
                              <p className="font-semibold text-ink text-sm">{r.authorName}</p>
                              <p className="text-xs text-ink/50">{r.customerPhone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {r.product?.images?.[0] ? (
                              <img src={r.product.images[0]} className="w-8 h-8 rounded object-cover" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-canvas" />
                            )}
                            <span className="text-sm font-medium text-ink truncate max-w-[120px]">{r.product?.name}</span>
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
                        <td className="px-6 py-4 text-sm text-ink/70 max-w-[200px]">
                          <p className="line-clamp-2">{r.comment}</p>
                          <p className="text-[10px] text-ink/40 mt-1">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
                        </td>
                        <td className="px-6 py-4">
                          {r.isApproved ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-success-soft text-success">Approuvé</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800">En attente</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {!r.isApproved && (
                              <button onClick={() => handleApprove(r.id)} className="p-1.5 text-success hover:bg-success-soft rounded-lg transition" title="Approuver">
                                <Check size={16} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(r.id)} className="p-1.5 text-action hover:bg-action-soft rounded-lg transition" title="Supprimer">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE (Répartition) */}
        <div className="space-y-6">
          
          {/* Diagramme de répartition */}
          <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-ink mb-4 flex items-center gap-2"><Star size={16} className="text-action" /> Répartition des avis</h3>
            
            <div className="flex items-center gap-6 mb-4">
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-canvas shrink-0">
                {/* Cercle simulé */}
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 absolute inset-0">
                  <path className="text-action" strokeDasharray={`${(Number(stats.average) / 5) * 100}, 100`} stroke="currentColor" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="text-center z-10">
                  <p className="font-bold text-lg leading-none">{stats.average}</p>
                  <p className="text-[10px] text-ink/50">/ 5</p>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = stats.distribution[stars - 1] || 0;
                  const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-ink/60 font-medium">{stars} étoile{stars > 1 ? 's' : ''}</span>
                      <div className="flex-1 h-1.5 bg-canvas rounded-full overflow-hidden">
                        <div className="h-full bg-action" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-8 text-right text-ink/50 font-semibold">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Avis vérifiés */}
          <div className="bg-action-soft border border-action/20 rounded-xl p-4 flex gap-3">
            <AlertCircle size={20} className="text-action shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-action text-sm">Avis vérifiés</h3>
              <p className="text-xs text-ink/70 mt-1">Tous les avis proviennent de clients ayant réellement passé commande sur votre boutique.</p>
            </div>
          </div>
        </div>

      </div>
    </AdminGuard>
  );
}