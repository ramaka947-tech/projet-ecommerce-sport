'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, findCountry, formatNationalPhone, normalize } from '@/lib/countries';

// Les emojis de drapeaux ne s'affichent pas sous Windows : on utilise de petites images
function Flag({ code }: { code: string }) {
  const c = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${c}.png`}
      srcSet={`https://flagcdn.com/w80/${c}.png 2x`}
      alt=""
      loading="lazy"
      className="inline-block h-[18px] w-auto shrink-0 rounded-[2px]"
    />
  );
}

type PickerProps = {
  id?: string;
  value: string;
  onChange: (code: string) => void;
  showDial: boolean; // true : on affiche l'indicatif (+221), false : le nom du pays
  wrapperClass?: string;
  panelClass?: string;
};

function FlagPicker({ id, value, onChange, showDial, wrapperClass = '', panelClass = '' }: PickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const current = findCountry(value);

  // Fermer en cliquant à côté ou avec Échap
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const list = useMemo(() => {
    const q = normalize(query);
    if (!q) return COUNTRIES;
    const digits = q.replace(/\D/g, '');
    return COUNTRIES.filter(
      (c) =>
        normalize(c.name).includes(q) ||
        c.code.toLowerCase() === q ||
        (digits !== '' && c.dial.replace('+', '').startsWith(digits)),
    );
  }, [query]);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={ref} className={`relative ${wrapperClass}`}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2.5 text-left text-ink transition focus:outline-none focus:ring-2 focus:ring-action/20 ${
          open ? 'border-action' : 'border-line hover:border-gray-400'
        }`}
      >
        <Flag code={current.code} />
        <span className="flex-1 truncate">{showDial ? current.dial : current.name}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? 'rotate-180 text-action' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-line bg-white text-ink shadow-lg ${panelClass}`}
        >
          <div className="border-b border-line p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un pays ou un indicatif"
                className="w-full rounded-md border border-line py-1.5 pl-8 pr-2 text-sm text-ink outline-none placeholder:text-gray-400 focus:border-action focus:ring-2 focus:ring-action/20"
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {list.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">Aucun résultat</li>}
            {list.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.code === value}
                  onClick={() => choose(c.code)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                    c.code === value
                      ? 'bg-action-soft font-semibold text-action'
                      : 'text-ink hover:bg-canvas'
                  }`}
                >
                  <Flag code={c.code} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className={c.code === value ? 'text-action' : 'text-gray-500'}>{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Liste de tous les pays, avec drapeaux
export function CountrySelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <FlagPicker
      id={id}
      value={value}
      onChange={onChange}
      showDial={false}
      wrapperClass="w-full"
      panelClass="w-full"
    />
  );
}

// Indicatif (drapeau + +221) et numéro
export function PhoneField({
  id,
  country,
  number,
  onCountryChange,
  onNumberChange,
  inputClass,
  required,
}: {
  id?: string;
  country: string;
  number: string;
  onCountryChange: (code: string) => void;
  onNumberChange: (value: string) => void;
  inputClass: string;
  required?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <FlagPicker
        value={country}
        onChange={onCountryChange}
        showDial
        wrapperClass="w-36 shrink-0"
        panelClass="w-72 max-w-[85vw]"
      />
      <input
        id={id}
        name="phoneNumber"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        placeholder={country === 'SN' ? '77 123 45 67' : ''}
        value={number}
        onChange={(e) => onNumberChange(e.target.value)}
        onBlur={() => onNumberChange(formatNationalPhone(country, number))}
        className={inputClass}
      />
    </div>
  );
}