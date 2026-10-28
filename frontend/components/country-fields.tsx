'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
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
      decoding="async"
      className="inline-block h-4.5 w-auto shrink-0 rounded-xs"
    />
  );
}

// Mobile = en dessous de md (768 px). Faux au rendu serveur : le panneau ne s'ouvre qu'au clic.
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mobile;
}

type PickerProps = {
  id?: string;
  value: string;
  onChange: (code: string) => void;
  showDial: boolean; // true : on affiche l'indicatif (+221), false : le nom du pays
  title: string; // titre de la feuille mobile
  wrapperClass?: string;
  panelClass?: string;
};

function FlagPicker({
  id,
  value,
  onChange,
  showDial,
  title,
  wrapperClass = '',
  panelClass = '',
}: PickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);
  const isMobile = useIsMobile();
  const current = findCountry(value);

  // Fermer avec Échap, et (desktop) en cliquant à côté.
  // Sur mobile, c'est le fond sombre de la feuille qui ferme.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    if (!isMobile) document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, isMobile]);

  // Mobile : la page derrière ne défile pas pendant que la feuille est ouverte
  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  // Mobile : on ouvre la liste sur le pays déjà choisi
  useEffect(() => {
    if (!open || !isMobile) return;
    const ul = listRef.current;
    const li = selectedRef.current;
    if (ul && li) ul.scrollTop = li.offsetTop - (ul.clientHeight - li.clientHeight) / 2;
  }, [open, isMobile]);

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

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const searchField = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400 md:left-2.5" />
      <input
        autoFocus={!isMobile}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          // Entrée choisit le premier résultat (et n'envoie jamais le formulaire)
          if (e.key === 'Enter') {
            e.preventDefault();
            if (list.length > 0) choose(list[0].code);
          }
        }}
        aria-label="Rechercher un pays ou un indicatif"
        placeholder="Rechercher un pays ou un indicatif"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        className="min-h-11 w-full rounded-md border border-line py-1.5 pl-9 pr-2 text-base text-ink outline-none placeholder:text-gray-400 focus:border-action focus:ring-2 focus:ring-action/20 md:min-h-0 md:pl-8 md:text-sm"
      />
    </div>
  );

  const listItems = (
    <>
      {list.length === 0 && <li className="px-4 py-3 text-sm text-gray-500 md:px-3 md:py-2">Aucun résultat</li>}
      {list.map((c) => (
        <li key={c.code} ref={c.code === value ? selectedRef : undefined}>
          <button
            type="button"
            role="option"
            aria-selected={c.code === value}
            onClick={() => choose(c.code)}
            className={`flex min-h-12 w-full touch-manipulation items-center gap-3 px-4 py-2 text-left text-base transition md:min-h-0 md:gap-2 md:px-3 md:text-sm ${
              c.code === value
                ? 'bg-action-soft font-semibold text-action'
                : 'text-ink active:bg-canvas md:hover:bg-canvas'
            }`}
          >
            <Flag code={c.code} />
            <span className="flex-1 truncate">{c.name}</span>
            <span className={c.code === value ? 'text-action' : 'text-gray-500'}>{c.dial}</span>
          </button>
        </li>
      ))}
    </>
  );

  return (
    <div ref={ref} className={`relative ${wrapperClass}`}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full touch-manipulation items-center gap-2 rounded-lg border bg-white px-3 py-3 text-left text-ink transition focus:outline-none focus:ring-2 focus:ring-action/20 md:py-2.5 ${
          open ? 'border-action' : 'border-line md:hover:border-gray-400'
        }`}
      >
        <Flag code={current.code} />
        <span className="flex-1 truncate">{showDial ? current.dial : current.name}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-gray-400 transition ${open ? 'rotate-180 text-action' : ''}`}
          aria-hidden
        />
      </button>

      {/* Desktop / tablette large : liste déroulante comme avant */}
      {open && !isMobile && (
        <div
          className={`absolute left-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-line bg-white text-ink shadow-lg ${panelClass}`}
        >
          <div className="border-b border-line p-2">{searchField}</div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {listItems}
          </ul>
        </div>
      )}

      {/* Mobile : feuille qui monte du bas, au-dessus de la barre de navigation (z-60) */}
      {open &&
        isMobile &&
        createPortal(
          <div className="fixed inset-0 z-60" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-black/40" onClick={close} />
            <div className="absolute inset-x-0 bottom-0 flex h-[85dvh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] text-ink shadow-2xl">
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line" />
              <div className="flex shrink-0 items-center justify-between pl-4 pr-1">
                <h2 className="text-base font-bold">{title}</h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Fermer"
                  className="flex size-11 touch-manipulation items-center justify-center rounded-full text-gray-500 active:bg-canvas"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="shrink-0 border-b border-line px-3 pb-3">{searchField}</div>
              <ul
                ref={listRef}
                role="listbox"
                className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
              >
                {listItems}
              </ul>
            </div>
          </div>,
          document.body,
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
      title="Choisir un pays"
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
        title="Indicatif du pays"
        wrapperClass="w-32 shrink-0 md:w-36"
        panelClass="w-72"
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
        className={`min-w-0 ${inputClass}`}
      />
    </div>
  );
}