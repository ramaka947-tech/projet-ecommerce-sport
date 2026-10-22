'use client';
import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { COLOR_PALETTE } from '@/lib/color-palette';
import {
  getSizes, createSize, deleteSize,
  getColors, createColor, deleteColor,
  getBrands, createBrand, deleteBrand,
} from '@/lib/api';

/* ---------- Petits utilitaires ---------- */

const LETTER_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL'];

function isLight(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

/* ---------- Pastille supprimable (tailles, marques) ---------- */

function Chip({ label, onDelete }: { label: string; onDelete: () => void }) {
  return (
    <li className="inline-flex items-center gap-2 bg-canvas border border-line rounded-full px-3 py-1.5 text-sm">
      <span>{label}</span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Supprimer ${label}`}
        className="text-ink/40 hover:text-action transition"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

/* ---------- Formulaire d'ajout simple ---------- */

function AddForm({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (name: string) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    try {
      await onAdd(value.trim());
      setValue('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2 mb-5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-[140px] border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-action"
      />
      <button
        type="submit"
        disabled={busy}
        className="bg-ink text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
      >
        <Plus size={16} />
        Ajouter
      </button>
    </form>
  );
}

/* ---------- Carte Marques ---------- */

function BrandsCard({
  items,
  onAdd,
  onDelete,
}: {
  items: any[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-line p-6">
      <h2 className="font-bold text-lg mb-4">Marques</h2>
      <AddForm placeholder="Ex: Nike, Adidas, Puma" onAdd={onAdd} />
      {items.length === 0 ? (
        <p className="text-sm text-ink/50">Aucune marque.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((b) => (
            <Chip key={b.id} label={b.name} onDelete={() => onDelete(b.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Carte Tailles (lettres et pointures séparées) ---------- */

function SizesCard({
  items,
  onAdd,
  onDelete,
}: {
  items: any[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { letters, numbers, others } = useMemo(() => {
    const letters: any[] = [];
    const numbers: any[] = [];
    const others: any[] = [];

    items.forEach((s) => {
      const n = String(s.name).trim();
      if (LETTER_ORDER.includes(n.toUpperCase())) letters.push(s);
      else if (/^\d/.test(n)) numbers.push(s);
      else others.push(s);
    });

    letters.sort(
      (a, b) =>
        LETTER_ORDER.indexOf(String(a.name).toUpperCase()) -
        LETTER_ORDER.indexOf(String(b.name).toUpperCase()),
    );
    numbers.sort(
      (a, b) => parseFloat(String(a.name).replace(',', '.')) - parseFloat(String(b.name).replace(',', '.')),
    );
    others.sort((a, b) => String(a.name).localeCompare(String(b.name)));

    return { letters, numbers, others };
  }, [items]);

  const Group = ({ title, list }: { title: string; list: any[] }) => (
    <div>
      <p className="text-xs font-medium text-ink/50 mb-2">{title}</p>
      {list.length === 0 ? (
        <p className="text-sm text-ink/40">Aucune.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {list.map((s) => (
            <Chip key={s.id} label={s.name} onDelete={() => onDelete(s.id)} />
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-line p-6">
      <h2 className="font-bold text-lg mb-4">Tailles</h2>
      <AddForm placeholder="Ex: S, M, L, 40, 42" onAdd={onAdd} />

      <div className="space-y-5">
        <Group title="Tailles en lettres" list={letters} />
        <div className="border-t border-line" />
        <Group title="Pointures et tailles chiffrées" list={numbers} />
        {others.length > 0 && (
          <>
            <div className="border-t border-line" />
            <Group title="Autres" list={others} />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Carte Couleurs (palette multi-sélection) ---------- */

function ColorsCard({
  items,
  onAddMany,
  onDelete,
}: {
  items: any[];
  onAddMany: (list: { name: string; hex: string }[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Noms déjà en base (comparaison sans accents ni majuscules)
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const existing = useMemo(() => new Set(items.map((c) => norm(c.name))), [items]);

  const toggle = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const submit = async () => {
    const list = COLOR_PALETTE.filter((c) => selected.includes(c.name));
    if (list.length === 0) return;
    setBusy(true);
    try {
      await onAddMany(list);
      setSelected([]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-line p-6 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-lg">Couleurs</h2>
          <p className="text-sm text-ink/50">
            Cliquez sur une ou plusieurs couleurs, puis ajoutez-les d'un coup.
          </p>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={busy || selected.length === 0}
          className="bg-action text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
        >
          <Plus size={16} />
          {selected.length > 0 ? `Ajouter (${selected.length})` : 'Ajouter'}
        </button>
      </div>

      {/* Palette */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-2 gap-y-4 mb-6">
        {COLOR_PALETTE.map((c) => {
          const already = existing.has(norm(c.name));
          const isSelected = selected.includes(c.name);
          return (
            <button
              key={c.name}
              type="button"
              disabled={already}
              aria-pressed={isSelected}
              onClick={() => toggle(c.name)}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition ${
                already ? 'opacity-35 cursor-not-allowed' : 'hover:bg-canvas'
              } ${isSelected ? 'bg-canvas' : ''}`}
            >
              <span
                className={`relative w-10 h-10 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-action ring-2 ring-action ring-offset-2' : 'border-line'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {(isSelected || already) && (
                  <Check size={18} className={isLight(c.hex) ? 'text-ink' : 'text-white'} />
                )}
              </span>
              <span className="text-xs text-center leading-tight">{c.name}</span>
              {already && <span className="text-[10px] text-ink/50">Déjà ajoutée</span>}
            </button>
          );
        })}
      </div>

      {/* Couleurs déjà en base */}
      <div className="border-t border-line pt-5">
        <p className="text-xs font-medium text-ink/50 mb-2">Couleurs disponibles pour vos produits</p>
        {items.length === 0 ? (
          <p className="text-sm text-ink/50">Aucune couleur pour le moment.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {items.map((c) => (
              <li
                key={c.id}
                className={`inline-flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm ${
                  c.hex ? 'bg-canvas border-line' : 'bg-white border-dashed border-action'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-line shrink-0"
                  style={{ backgroundColor: c.hex || '#E5E5E5' }}
                />
                <span>{c.name}</span>
                {!c.hex && <span className="text-xs text-action">sans code couleur</span>}
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  aria-label={`Supprimer ${c.name}`}
                  className="text-ink/40 hover:text-action transition"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function AttributesPage() {
  const [sizes, setSizes] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const load = async () => {
    setSizes(await getSizes());
    setColors(await getColors());
    setBrands(await getBrands());
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminGuard>
      <h1 className="text-3xl font-bold mb-2">Variantes</h1>
      <p className="text-sm text-gray-500 mb-8">
        Gérez les tailles, couleurs et marques disponibles pour vos produits.
      </p>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <SizesCard
          items={sizes}
          onAdd={async (name) => {
            await createSize(name);
            load();
          }}
          onDelete={async (id) => {
            await deleteSize(id);
            load();
          }}
        />

        <BrandsCard
          items={brands}
          onAdd={async (name) => {
            await createBrand(name);
            load();
          }}
          onDelete={async (id) => {
            await deleteBrand(id);
            load();
          }}
        />

        <ColorsCard
          items={colors}
          onAddMany={async (list) => {
            await Promise.all(list.map((c) => createColor(c.name, c.hex)));
            load();
          }}
          onDelete={async (id) => {
            await deleteColor(id);
            load();
          }}
        />
      </div>
    </AdminGuard>
  );
}