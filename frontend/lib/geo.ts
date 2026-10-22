import { normalize } from './countries';

export const REGIONS_SENEGAL = [
  'Dakar',
  'Diourbel',
  'Fatick',
  'Kaffrine',
  'Kaolack',
  'Kédougou',
  'Kolda',
  'Louga',
  'Matam',
  'Saint-Louis',
  'Sédhiou',
  'Tambacounda',
  'Thiès',
  'Ziguinchor',
];

const ISO_TO_REGION: Record<string, string> = {
  'SN-DK': 'Dakar',
  'SN-DB': 'Diourbel',
  'SN-FK': 'Fatick',
  'SN-KA': 'Kaffrine',
  'SN-KL': 'Kaolack',
  'SN-KE': 'Kédougou',
  'SN-KD': 'Kolda',
  'SN-LG': 'Louga',
  'SN-MT': 'Matam',
  'SN-SL': 'Saint-Louis',
  'SN-SE': 'Sédhiou',
  'SN-TC': 'Tambacounda',
  'SN-TH': 'Thiès',
  'SN-ZG': 'Ziguinchor',
};

// Fait correspondre un texte libre ("dakar", "Thies") à une région de la liste
export function matchRegion(text?: string | null): string {
  if (!text) return '';
  const t = normalize(text);
  return REGIONS_SENEGAL.find((r) => normalize(r) === t) ?? '';
}

// Retrouve la région sénégalaise à partir de la réponse OpenStreetMap
function findRegion(addr: any): string {
  const iso = addr['ISO3166-2-lvl4'] || addr['ISO3166-2-lvl6'];
  if (iso && ISO_TO_REGION[iso]) return ISO_TO_REGION[iso];

  const candidates = [addr.state, addr.region, addr.county, addr.state_district, addr.city]
    .filter(Boolean)
    .map(normalize);
  for (const c of candidates) {
    const match = REGIONS_SENEGAL.find((r) => c.includes(normalize(r)));
    if (match) return match;
  }
  return '';
}

// Transforme des coordonnées GPS en adresse (service gratuit OpenStreetMap / Nominatim)
async function reverseGeocode(lat: number, lng: number): Promise<any | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=fr&lat=${lat}&lon=${lng}`,
      { signal: ctrl.signal },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.address ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type LocationResult = {
  coords: { lat: number; lng: number };
  accuracy: number;
  resolved: boolean; // false : position trouvée mais adresse non déduite
  countryCode: string | null;
  region: string;
  quartier: string;
  road: string;
};

// Demande la position de l'appareil et en déduit pays, région, quartier et rue.
// En cas de problème, rejette avec un message prêt à afficher.
export function getMyLocation(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(
        new Error(
          'Votre navigateur ne gère pas la localisation. Saisissez votre adresse à la main.',
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const addr = await reverseGeocode(lat, lng);

        if (!addr) {
          resolve({
            coords: { lat, lng },
            accuracy,
            resolved: false,
            countryCode: null,
            region: '',
            quartier: '',
            road: '',
          });
          return;
        }

        const countryCode = String(addr.country_code || '').toUpperCase() || null;
        const region =
          countryCode === 'SN' ? findRegion(addr) : addr.state || addr.city || '';
        const quartier =
          addr.neighbourhood ||
          addr.quarter ||
          addr.suburb ||
          addr.city_district ||
          addr.village ||
          addr.town ||
          '';
        const road = [addr.house_number, addr.road].filter(Boolean).join(' ');

        resolve({ coords: { lat, lng }, accuracy, resolved: true, countryCode, region, quartier, road });
      },
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Localisation refusée. Autorisez-la dans votre navigateur ou saisissez votre adresse à la main.'
              : 'Position introuvable. Saisissez votre adresse à la main.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}