'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X, Shirt, Tag, Palette, Check, Loader2 } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { COLOR_PALETTE } from '@/lib/color-palette';
import {
  getSizes, createSize, deleteSize,
  getColors, createColor, deleteColor,
  getBrands, createBrand, deleteBrand,
} from '@/lib/api';

// Utilitaires
const LETTER_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL'];
const isLight = (hex: string) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
};

// Composant d'ajout simple
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
    <form onSubmit={submit} className="flex flex-wrap gap-2 mb-6">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-[200px] border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-action bg-canvas/30"
      />
      <button type="submit" disabled={busy} className="bg-action text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-action-dark transition disabled:opacity-50 flex items-center gap-2">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        {btnLabel}
      </button>
    </form>
  );
}

// Chip standard pour Tailles et Marques
function Chip({ label, onDelete }: { label: string; onDelete: () => void }) {
  return (
    <li className="inline-flex items-center gap-2 bg-white border border-line rounded-md px-2.5 py-1 text-sm font-medium">
      <span>{label}</span>
      <button type="button" onClick={onDelete} className="text-ink/40 hover:text-action transition">
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

  // Couleurs sélectionnées pour l'ajout multiple
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [addingColors, setAddingColors] = useState(false);

  const load = async () => {
    const [s, c, b] = await Promise.all([getSizes(), getColors(), getBrands()]);
    setSizes(s); setColors(c); setBrands(b); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Séparation des tailles
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

  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const existingColors = new Set(colors.map(c => norm(c.name)));

  if (loading) return <div className="p-8"><Loader2 className="animate-spin text-action" /></div>;

  return (
    <AdminGuard>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-action/10 text-action flex items-center justify-center">
            <Palette size={20} />
          </div>
          <h1 className="text-2xl font-bold text-ink">Tailles & couleurs</h1>
        </div>
        <p className="text-sm text-ink/60">Gérez les tailles, les marques et les couleurs disponibles pour vos produits.</p>
      </div>

      <div className="space-y-6">
        
        {/* CARTE TAILLES */}
        <section className="bg-white rounded-2xl border border-line p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-action text-white flex items-center justify-center"><Shirt size={18} /></div>
            <div>
              <h2 className="text-lg font-bold text-ink">Tailles</h2>
              <p className="text-xs text-ink/50">Ajoutez et gérez les tailles disponibles pour vos produits.</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-[300px_1fr] gap-8">
            <div>
              <AddForm placeholder="Ex: S, M, L, XL ou 38, 40, 42..." onAdd={async (name) => { await createSize(name); load(); }} />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1">
                <p className="text-sm font-semibold mb-3">Tailles lettre</p>
                <ul className="flex flex-wrap gap-2">
                  {letters.map(s => <Chip key={s.id} label={s.name} onDelete={async () => { await deleteSize(s.id); load(); }} />)}
                  {letters.length === 0 && <p className="text-sm text-ink/40">Aucune.</p>}
                </ul>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-3">Tailles numériques</p>
                <ul className="flex flex-wrap gap-2">
                  {numbers.map(s => <Chip key={s.id} label={s.name} onDelete={async () => { await deleteSize(s.id); load(); }} />)}
                  {numbers.length === 0 && <p className="text-sm text-ink/40">Aucune.</p>}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CARTE MARQUES */}
        <section className="bg-white rounded-2xl border border-line p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-action text-white flex items-center justify-center"><Tag size={18} /></div>
            <div>
              <h2 className="text-lg font-bold text-ink">Marques</h2>
              <p className="text-xs text-ink/50">Ajoutez et gérez les marques disponibles pour vos produits.</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-[300px_1fr] gap-8 items-start">
            <AddForm placeholder="Ex: Nike, Adidas, Puma..." onAdd={async (name) => { await createBrand(name); load(); }} />
            <div>
              <p className="text-sm font-semibold mb-3">Marques disponibles</p>
              <ul className="flex flex-wrap gap-2">
                {brands.map(b => <Chip key={b.id} label={b.name} onDelete={async () => { await deleteBrand(b.id); load(); }} />)}
                {brands.length === 0 && <p className="text-sm text-ink/40">Aucune marque.</p>}
              </ul>
            </div>
          </div>
        </section>

        {/* CARTE COULEURS */}
        <section className="bg-white rounded-2xl border border-line p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-action text-white flex items-center justify-center"><Palette size={18} /></div>
              <div>
                <h2 className="text-lg font-bold text-ink">Couleurs</h2>
                <p className="text-xs text-ink/50">Ajoutez et gérez les couleurs disponibles pour vos produits.</p>
              </div>
            </div>
            <button 
              onClick={handleAddColors} 
              disabled={addingColors || selectedColors.length === 0}
              className="bg-action text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-action-dark transition disabled:opacity-50 flex items-center gap-2"
            >
              {addingColors ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Ajouter une couleur
            </button>
          </div>

          {/* Palette de sélection */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-8">
            {COLOR_PALETTE.map((c) => {
              const already = existingColors.has(norm(c.name));
              const isSel = selectedColors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  disabled={already}
                  onClick={() => toggleColor(c.name)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-xl transition ${already ? 'opacity-30 cursor-not-allowed' : 'hover:bg-canvas'} ${isSel ? 'bg-canvas border border-action/30' : 'border border-transparent'}`}
                >
                  <span 
                    className={`w-10 h-10 rounded-full border border-line flex items-center justify-center transition ${isSel ? 'ring-2 ring-action ring-offset-2' : ''}`} 
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSel && <Check size={16} className={isLight(c.hex) ? 'text-ink' : 'text-white'} strokeWidth={3} />}
                  </span>
                  <span className="text-xs font-medium text-ink/80">{c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Couleurs ajoutées */}
          <div className="border-t border-line pt-5 bg-canvas/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-ink/50 mb-3">Couleurs actives (visibles sur la boutique)</p>
            {colors.length === 0 ? (
              <p className="text-sm text-ink/40">Aucune couleur active.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <li key={c.id} className="inline-flex items-center gap-2 bg-white border border-line rounded-md pl-2 pr-1 py-1 text-sm font-medium">
                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: c.hex || '#ccc' }} />
                    {c.name}
                    <button onClick={async () => { await deleteColor(c.id); load(); }} className="p-1 text-ink/40 hover:text-action rounded hover:bg-action-soft transition">
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

      </div>
    </AdminGuard>
  );
}