// Tailles de vêtements dans l'ordre d'affichage
const LETTER_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL'];

export function isNumericSize(name: string): boolean {
  return /^\d+([.,]\d+)?$/.test(String(name).trim());
}

/** Vrai si toutes les tailles sont des nombres (pointures de chaussures) */
export function isNumericSizes(names: string[]): boolean {
  return names.length > 0 && names.every(isNumericSize);
}

/**
 * Groupe d'une taille. Si la taille a un champ `group` défini côté admin,
 * il est utilisé. Sinon on le déduit : nombres = Chaussures, lettres = Vêtements.
 */
export function sizeGroupOf(size: { name: string; group?: string | null }): string {
  return size.group || (isNumericSize(size.name) ? 'Chaussures' : 'Vêtements');
}

/** Comparateur : nombres croissants (40, 41, 42…), lettres XS → XXXL */
export function compareSizes(a: string, b: string): number {
  const na = isNumericSize(a);
  const nb = isNumericSize(b);
  if (na && nb) return parseFloat(a.replace(',', '.')) - parseFloat(b.replace(',', '.'));
  if (na !== nb) return na ? 1 : -1;
  const ra = LETTER_ORDER.indexOf(a.trim().toUpperCase());
  const rb = LETTER_ORDER.indexOf(b.trim().toUpperCase());
  return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb);
}

export function sortSizes(names: string[]): string[] {
  return [...names].sort(compareSizes);
}