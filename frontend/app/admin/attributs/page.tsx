'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus, X, Shirt, Tag, Palette, Check, Loader2 } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { COLOR_PALETTE } from '@/lib/color-palette';
import ConfirmModal from '@/components/ui/confirm-modal';
import {
  getSizes, createSize, deleteSize,
  getColors, createColor, deleteColor,
  getBrands, createBrand, deleteBrand,
} from '@/lib/api';

const LETTER_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL'];
const isLight = (hex: string) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
};

function AddForm({ placeholder, onAdd, btnLabel = "Ajouter" }: { placeholder: string; onAdd: (name: string) => Promise<void>; btnLabel?: string }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    try { await onAdd(value.trim()); setValue(''); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="mb-5 flex flex-col gap-2 sm:flex-row md:mb-6">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full flex-1 rounded-lg border border-line bg-canvas/30 px-3 text-base focus:border-action focus:outline-none md:min-h-0 md:py-2.5 md:text-sm"
      />
      <button type="submit" disabled={busy} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-action px-4 text-sm font-semibold text-white transition hover:bg-action-dark disabled:opacity-50 md:min-h-0 md:py-2.5">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        {btnLabel}
      </button>
    </form>
  );
}

function Chip({ label, onDelete }: { label: string; onDelete: () => void }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white py-1 pl-2.5 pr-1 text-sm font-medium">
      <span>{label}</span>
      <button type="button" onClick={onDelete} aria-label={`Supprimer ${label}`} className="flex size-7 items-center justify-center rounded text-ink/40 transition hover:bg-action-soft hover:text-action">
        <X size={14} />
      </button>
    </li>
  );
}

export default function AttributesPage() {
  const [sizes, setSizes] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [addingColors, setAddingColors] = useState(false);

  // État pour la modale de suppression
  const [deleteConfig, setDeleteConfig] = useState<{
    id: string;
    type: 'size' | 'color' | 'brand';
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    const [s, c, b] = await Promise.all([getSizes(), getColors(), getBrands()]);
    setSizes(s); setColors(c); setBrands(b); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const { letters, numbers } = useMemo(() => {
    const letters: any[] = []; const numbers: any[] = [];
    sizes.forEach((s) => {
      const n = String(s.name).trim();
      if (LETTER_ORDER.includes(n.toUpperCase())) letters.push(s);
      else if (/^\d/.test(n)) numbers.push(s);
    });
    letters.sort((a, b) => LETTER_ORDER.indexOf(a.name.toUpperCase()) - LETTER_ORDER.indexOf(b.name.toUpperCase()));
    numbers.sort((a, b) => parseFloat(a.name) - parseFloat(b.name));
    return { letters, numbers };
  }, [sizes]);

  const toggleColor = (name: string) => setSelectedColors(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const handleAddColors = async () => {
    if (!selectedColors.length) return;
    setAddingColors(true);
    const toAdd = COLOR_PALETTE.filter(c => selectedColors.includes(c.name));
    await Promise.all(toAdd.map(c => createColor(c.name, c.hex)));
    setSelectedColors([]);
    await load();
    setAddingColors(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfig) return;
    setIsDeleting(true);
    try {
      if (deleteConfig.type === 'size') await deleteSize(deleteConfig.id);
      if (deleteConfig.type === 'color') await deleteColor(deleteConfig.id);
      if (deleteConfig.type === 'brand') await deleteBrand(deleteConfig.id);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setDeleteConfig(null);
    }
  };

  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const existingColors = new Set(colors.map(c => norm(c.name)));

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-action" /></div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="mb-6 md:mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-action/10 text-action">
            <Palette size={20} />
          </div>
          <h1 className="text-xl font-bold text-ink md:text-2xl">Tailles & couleurs</h1>
        </div>
        <p className="text-sm text-ink/60">Gérez les tailles, les marques et les couleurs disponibles pour vos produits.</p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* TAILLES */}
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-3 md:mb-5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-action text-white"><Shirt size={18} /></div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink md:text-lg">Tailles</h2>
              <p className="text-xs text-ink/50">Ajoutez et gérez les tailles disponibles pour vos produits.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[300px_1fr] md:gap-8">
            <div>
              <AddForm placeholder="Ex: S, M, L, XL ou 38, 40, 42..." onAdd={async (name) => { await createSize(name); load(); }} />
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
              <div className="min-w-0 flex-1">
                <p className="mb-3 text-sm font-semibold">Tailles lettre</p>
                <ul className="flex flex-wrap gap-2">
                  {letters.map(s => (
                    <Chip 
                      key={s.id} 
                      label={s.name} 
                      onDelete={() => setDeleteConfig({ id: s.id, type: 'size', name: s.name })} 
                    />
                  ))}
                  {letters.length === 0 && <p className="text-sm text-ink/40">Aucune.</p>}
                </ul>
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-3 text-sm font-semibold">Tailles numériques</p>
                <ul className="flex flex-wrap gap-2">
                  {numbers.map(s => (
                    <Chip 
                      key={s.id} 
                      label={s.name} 
                      onDelete={() => setDeleteConfig({ id: s.id, type: 'size', name: s.name })} 
                    />
                  ))}
                  {numbers.length === 0 && <p className="text-sm text-ink/40">Aucune.</p>}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUES */}
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-3 md:mb-5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-action text-white"><Tag size={18} /></div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink md:text-lg">Marques</h2>
              <p className="text-xs text-ink/50">Ajoutez et gérez les marques disponibles pour vos produits.</p>
            </div>
          </div>

          <div className="grid items-start gap-6 md:grid-cols-[300px_1fr] md:gap-8">
            <AddForm placeholder="Ex: Nike, Adidas, Puma..." onAdd={async (name) => { await createBrand(name); load(); }} />
            <div className="min-w-0">
              <p className="mb-3 text-sm font-semibold">Marques disponibles</p>
              <ul className="flex flex-wrap gap-2">
                {brands.map(b => (
                  <Chip 
                    key={b.id} 
                    label={b.name} 
                    onDelete={() => setDeleteConfig({ id: b.id, type: 'brand', name: b.name })} 
                  />
                ))}
                {brands.length === 0 && <p className="text-sm text-ink/40">Aucune marque.</p>}
              </ul>
            </div>
          </div>
        </section>

        {/* COULEURS */}
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:flex-wrap md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-action text-white"><Palette size={18} /></div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-ink md:text-lg">Couleurs</h2>
                <p className="text-xs text-ink/50">Ajoutez et gérez les couleurs disponibles pour vos produits.</p>
              </div>
            </div>
            <button
              onClick={handleAddColors}
              disabled={addingColors || selectedColors.length === 0}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-action px-4 text-sm font-semibold text-white transition hover:bg-action-dark disabled:opacity-50 md:min-h-0 md:py-2.5"
            >
              {addingColors ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Ajouter {selectedColors.length > 0 ? `(${selectedColors.length})` : ''}
            </button>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 md:mb-8 md:grid-cols-8">
            {COLOR_PALETTE.map((c) => {
              const already = existingColors.has(norm(c.name));
              const isSel = selectedColors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  disabled={already}
                  onClick={() => toggleColor(c.name)}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl p-2 transition ${already ? 'cursor-not-allowed opacity-30' : 'hover:bg-canvas'} ${isSel ? 'border border-action/30 bg-canvas' : 'border border-transparent'}`}
                >
                  <span
                    className={`flex size-9 items-center justify-center rounded-full border border-line transition md:size-10 ${isSel ? 'ring-2 ring-action ring-offset-2' : ''}`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSel && <Check size={16} className={isLight(c.hex) ? 'text-ink' : 'text-white'} strokeWidth={3} />}
                  </span>
                  <span className="truncate text-[11px] font-medium leading-tight text-ink/80 md:text-xs">{c.name}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border-t border-line bg-canvas/30 p-3 md:p-4">
            <p className="mb-3 text-sm font-semibold text-ink/50">Couleurs actives (visibles sur la boutique)</p>
            {colors.length === 0 ? (
              <p className="text-sm text-ink/40">Aucune couleur active.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <li key={c.id} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white py-1 pl-2 pr-1 text-sm font-medium">
                    <span className="size-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: c.hex || '#ccc' }} />
                    <span className="truncate">{c.name}</span>
                    <button 
                      onClick={() => setDeleteConfig({ id: c.id, type: 'color', name: c.name })} 
                      aria-label={`Supprimer ${c.name}`} 
                      className="flex size-7 items-center justify-center rounded text-ink/40 transition hover:bg-action-soft hover:text-action"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* MODALE DE CONFIRMATION */}
      <ConfirmModal
        isOpen={!!deleteConfig}
        title="Supprimer cet élément ?"
        message={`Voulez-vous vraiment supprimer "${deleteConfig?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfig(null)}
      />
    </AdminGuard>
  );
}