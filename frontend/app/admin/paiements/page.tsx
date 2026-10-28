'use client';
import { useEffect, useState } from 'react';
import { Trash2, Pencil, Plus, CreditCard, Loader2, Power, CheckCircle2 } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import {
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '@/lib/api';

const empty = { name: '', instructions: '', isActive: true };

const getLogo = (name: string) => {
  const n = name.toLowerCase();

  if (n.includes('wave')) {
    return (
      <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-line shadow-sm">
        <img src="/wave.png" alt="Wave" className="size-full object-cover" />
      </div>
    );
  }

  if (n.includes('orange')) {
    return (
      <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-line shadow-sm">
        <img src="/orange.png" alt="Orange Money" className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-line bg-canvas shadow-sm">
      <CreditCard size={24} className="text-ink/40" />
    </div>
  );
};

export default function PaiementsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setMethods(await getAllPaymentMethods());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setForm(empty);
    setEditingId(null);
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setMessage('Le nom est obligatoire.');
    setMessage('');
    setSaving(true);
    try {
      if (editingId) await updatePaymentMethod(editingId, form);
      else await createPaymentMethod({ ...form, position: methods.length });
      reset();
      await load();
    } catch {
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setForm({ name: m.name, instructions: m.instructions || '', isActive: m.isActive });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = async (m: any) => {
    await updatePaymentMethod(m.id, { isActive: !m.isActive });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce moyen de paiement ?')) return;
    await deletePaymentMethod(id);
    load();
  };

  const inputCls =
    'min-h-11 w-full rounded-lg border border-line bg-canvas/30 px-3 text-base focus:border-action focus:outline-none md:min-h-0 md:py-2.5 md:text-sm';

  return (
    <AdminGuard>
      <div className="mb-6 md:mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-action text-white">
            <CreditCard size={20} />
          </div>
          <h1 className="text-xl font-bold text-ink md:text-2xl">Moyens de paiement</h1>
        </div>
        <p className="text-sm text-ink/60">Gérez les moyens de paiement proposés aux clients lors de la commande.</p>
      </div>

      {/* Formulaire */}
      <div className="mb-6 max-w-3xl rounded-2xl border border-line bg-white p-4 shadow-sm md:mb-8 md:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink md:mb-5 md:text-lg">
          {editingId ? <Pencil size={18} className="text-action" /> : <Plus size={18} className="text-action" />}
          {editingId ? 'Modifier le moyen de paiement' : 'Ajouter un moyen de paiement'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pm_name" className="mb-1.5 block text-sm font-semibold">Nom</label>
            <input
              id="pm_name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex : Wave, Orange Money, Paiement à la livraison"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="pm_instructions" className="mb-1.5 block text-sm font-semibold">Instructions (optionnel)</label>
            <textarea
              id="pm_instructions"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Ex : Envoyez le montant au 77 000 00 00 puis confirmez par WhatsApp."
              rows={3}
              className="min-h-24 w-full resize-none rounded-lg border border-line bg-canvas/30 px-3 py-2.5 text-base focus:border-action focus:outline-none md:min-h-0 md:text-sm"
            />
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 md:min-h-0 md:gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="size-5 accent-action md:size-4"
            />
            <span className="text-sm font-medium">Activer ce moyen de paiement</span>
          </label>

          {message && <p className="text-sm font-medium text-action">{message}</p>}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-action px-6 font-semibold text-white transition hover:bg-action-dark disabled:opacity-50 md:min-h-0 md:py-2.5"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Ajouter'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="min-h-11 rounded-lg border border-line px-6 font-semibold text-ink transition hover:bg-canvas md:min-h-0 md:py-2.5">
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-action" /></div>
      ) : methods.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center text-ink/50">
          Aucun moyen de paiement pour l'instant.
        </div>
      ) : (
        <div className="max-w-3xl space-y-3 md:space-y-4">
          {methods.map((m) => (
            <div key={m.id} className="rounded-2xl border border-line bg-white p-3 shadow-sm md:p-4">
              <div className="flex items-start gap-3 md:items-center md:gap-4">
                {getLogo(m.name)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-ink md:text-lg">{m.name}</p>
                  {m.instructions && (
                    <p className="mt-1 line-clamp-2 text-xs text-ink/50 md:line-clamp-1 md:text-sm">{m.instructions}</p>
                  )}
                  <span className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${m.isActive ? 'bg-success-soft text-success' : 'bg-canvas text-ink/50'}`}>
                    <span className={`size-1.5 rounded-full ${m.isActive ? 'bg-success' : 'bg-ink/30'}`} />
                    {m.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              {/* Actions : ligne sous le contenu sur mobile */}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 md:mt-0 md:justify-end md:border-0 md:pt-0">
                <button
                  onClick={() => handleToggle(m)}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-ink/70 transition hover:bg-canvas md:min-h-0 md:flex-none md:py-2"
                >
                  <Power size={14} /> {m.isActive ? 'Désactiver' : 'Activer'}
                </button>

                <button onClick={() => handleEdit(m)} aria-label="Modifier" className="flex size-10 items-center justify-center rounded-lg bg-canvas text-ink/50 transition hover:bg-line hover:text-ink md:size-auto md:p-2">
                  <Pencil size={16} />
                </button>

                <button onClick={() => handleDelete(m.id)} aria-label="Supprimer" className="flex size-10 items-center justify-center rounded-lg bg-action-soft text-action transition hover:bg-action hover:text-white md:size-auto md:p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}