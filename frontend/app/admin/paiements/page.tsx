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

// Fonction pour afficher les images que tu as enregistrées
const getLogo = (name: string) => {
  const n = name.toLowerCase();
  
  if (n.includes('wave')) {
    return (
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-line">
        <img src="/wave.png" alt="Wave" className="w-full h-full object-cover" />
      </div>
    );
  }
  
  if (n.includes('orange')) {
    return (
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-line">
        <img src="/orange.png" alt="Orange Money" className="w-full h-full object-cover" />
      </div>
    );
  }
  
  return (
    <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center shrink-0 shadow-sm border border-line">
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

  return (
    <AdminGuard>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-action text-white flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <h1 className="text-2xl font-bold text-ink">Moyens de paiement</h1>
        </div>
        <p className="text-sm text-ink/60">Gérez les moyens de paiement qui sont proposés aux clients lors de la commande.</p>
      </div>

      {/* Formulaire d'ajout / modification */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm mb-8 max-w-3xl">
        <h2 className="text-lg font-bold text-ink mb-5 flex items-center gap-2">
          {editingId ? <Pencil size={18} className="text-action" /> : <Plus size={18} className="text-action" />}
          {editingId ? 'Modifier le moyen de paiement' : 'Ajouter / Modifier un moyen de paiement'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Nom</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex : Wave, Orange Money, Paiement à la livraison"
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-action bg-canvas/30"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Instructions pour le client (optionnel)</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Ex : Envoyez le montant au 77 000 00 00 puis confirmez par WhatsApp."
              rows={3}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-action bg-canvas/30"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 accent-action"
            />
            Activer ce moyen de paiement
          </label>

          {message && <p className="text-action text-sm font-medium">{message}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-action text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-action-dark transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Ajouter'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="px-6 py-2.5 rounded-lg border border-line text-ink font-semibold hover:bg-canvas transition">
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Liste des moyens de paiement */}
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-action" /></div>
      ) : methods.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl p-12 text-center text-ink/50">
          Aucun moyen de paiement pour l'instant.
        </div>
      ) : (
        <div className="max-w-3xl space-y-4">
          {methods.map((m) => (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-line rounded-2xl p-4 shadow-sm">
              
              <div className="flex items-center gap-4">
                {getLogo(m.name)}
                <div>
                  <p className="font-bold text-ink text-lg">{m.name}</p>
                  {m.instructions && (
                    <p className="text-sm text-ink/50 mt-1 max-w-md line-clamp-1">{m.instructions}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${m.isActive ? 'bg-success-soft text-success' : 'bg-canvas text-ink/50'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? 'bg-success' : 'bg-ink/30'}`} />
                  {m.isActive ? 'Actif' : 'Inactif'}
                </span>
                
                <button
                  onClick={() => handleToggle(m)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-line text-ink/70 text-xs font-semibold rounded-lg hover:bg-canvas transition"
                >
                  <Power size={14} /> {m.isActive ? 'Désactiver' : 'Activer'}
                </button>
                
                <button onClick={() => handleEdit(m)} title="Modifier" className="p-2 text-ink/50 hover:text-ink bg-canvas hover:bg-line rounded-lg transition">
                  <Pencil size={16} />
                </button>
                
                <button onClick={() => handleDelete(m.id)} title="Supprimer" className="p-2 text-action bg-action-soft hover:bg-action hover:text-white rounded-lg transition">
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