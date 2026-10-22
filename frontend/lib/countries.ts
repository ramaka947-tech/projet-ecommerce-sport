import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

export type Country = { code: string; name: string; dial: string };

export const DEFAULT_COUNTRY = 'SN';

export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Noms des pays en français, fournis par le navigateur / Node
const names = new Intl.DisplayNames(['fr'], { type: 'region' });

const all: Country[] = getCountries()
  .map((code) => ({
    code: code as string,
    name: names.of(code) || code,
    dial: `+${getCountryCallingCode(code)}`,
  }))
  // on retire les territoires sans nom lisible
  .filter((c) => c.name !== c.code);

// Sénégal en premier, puis tous les autres par ordre alphabétique
export const COUNTRIES: Country[] = [...all].sort((a, b) => {
  if (a.code === DEFAULT_COUNTRY) return -1;
  if (b.code === DEFAULT_COUNTRY) return 1;
  return a.name.localeCompare(b.name, 'fr');
});

export const findCountry = (code: string): Country =>
  COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

// Retrouve un pays à partir d'un texte libre (nom ou code) : utile pour les anciens comptes
export function countryCodeFrom(value?: string | null): string | null {
  if (!value) return null;
  const v = normalize(value);
  const byCode = COUNTRIES.find((c) => c.code.toLowerCase() === v);
  if (byCode) return byCode.code;
  return COUNTRIES.find((c) => normalize(c.name) === v)?.code ?? null;
}

// Sépare un numéro enregistré (ex. "+221 78 112 99 52") en pays + numéro national
export function splitPhone(stored?: string | null): { country: string; number: string } | null {
  if (!stored) return null;
  const p = parsePhoneNumberFromString(stored, DEFAULT_COUNTRY as CountryCode);
  if (!p) return null;
  const country =
    p.country ||
    COUNTRIES.find((c) => c.dial === `+${p.countryCallingCode}`)?.code ||
    DEFAULT_COUNTRY;
  return { country, number: p.formatNational() };
}

// Retourne un message d'erreur, ou null si le numéro est valide
export function validatePhone(country: string, input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (country === 'SN') {
    const national = digits.startsWith('221') && digits.length === 12 ? digits.slice(3) : digits;
    if (!/^(70|75|76|77|78)\d{7}$/.test(national)) {
      return 'Numéro sénégalais invalide : 9 chiffres, commençant par 70, 75, 76, 77 ou 78.';
    }
    return null;
  }
  return isValidPhoneNumber(input, country as CountryCode)
    ? null
    : 'Numéro de téléphone invalide pour ce pays.';
}

// Numéro complet avec indicatif, prêt à être enregistré
export function formatFullPhone(country: string, input: string): string {
  const p = parsePhoneNumberFromString(input, country as CountryCode);
  if (p) return p.formatInternational();
  return `${findCountry(country).dial} ${input.replace(/\D/g, '')}`;
}

// Met en forme le numéro quand on quitte le champ (77 123 45 67)
export function formatNationalPhone(country: string, input: string): string {
  const p = parsePhoneNumberFromString(input, country as CountryCode);
  return p && p.isValid() ? p.formatNational() : input;
}