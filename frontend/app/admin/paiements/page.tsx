'use client';
import { useEffect, useState } from 'react';
import { Trash2, Pencil, Plus } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import {
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '@/lib/api';

const empty = { name: '', instructions: '', isActive: true };

export default function PaiementsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMethods(await getAllPaymentMethods());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm(empty);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setMessage('Le nom est obligatoire.');
      return;
    }
    setMessage('');
    try {
      if (editingId) await updatePaymentMethod(editingId, form);
      else await createPaymentMethod({ ...form, position: methods.length });
      reset();
      await load();
    } catch {
      setMessage("Erreur lors de l'enregistrement.");
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
      <h1 className="text-3xl font-bold mb-2">Moyens de paiement</h1>
      <p className="text-sm text-gray-500 mb-8">
        Les moyens actifs sont proposés au client lors de la commande.
      </p>

      <div className="max-w-2xl bg-white border rounded-lg p-5 mb-8 space-y-4">
        <h2 className="font-semibold">
          {editingId ? 'Modifier le moyen de paiement' : 'Ajouter un moyen de paiement'}
        </h2>

        <div>
          <label className="block text-sm mb-1">Nom</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex : Wave, Orange Money, Paiement à la livraison"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Instructions pour le client (optionnel)</label>
          <textarea
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            placeholder="Ex : Envoyez le montant au 77 000 00 00 puis confirmez par WhatsApp."
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Actif (visible par les clients)
        </label>

        {message && <p className="text-red-500 text-sm">{message}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 bg-black text-white px-5 py-2 rounded-lg hover:opacity-90"
          >
            <Plus size={16} />
            {editingId ? 'Enregistrer' : 'Ajouter'}
          </button>
          {editingId && (
            <button onClick={reset} className="px-5 py-2 rounded-lg border">
              Annuler
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : methods.length === 0 ? (
        <p className="text-gray-500">Aucun moyen de paiement pour l'instant.</p>
      ) : (
        <div className="max-w-2xl space-y-3">
          {methods.map((m) => (
            <div
              key={m.id}
              className="flex items-start justify-between gap-4 bg-white border rounded-lg p-4"
            >
              <div>
                <p className="font-semibold">
                  {m.name}
                  {!m.isActive && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                      Désactivé
                    </span>
                  )}
                </p>
                {m.instructions && (
                  <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{m.instructions}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(m)}
                  className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
                >
                  {m.isActive ? 'Désactiver' : 'Activer'}
                </button>
                <button onClick={() => handleEdit(m)} title="Modifier" className="p-2 rounded hover:bg-gray-100">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(m.id)} title="Supprimer" className="p-2 rounded text-red-500 hover:bg-red-50">
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