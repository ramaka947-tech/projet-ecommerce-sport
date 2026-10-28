import { getSettings } from '@/lib/api';

export type AboutData = { 
  title: string; 
  paragraphs: string[];
  image?: string; // <-- Ajouté
};

export const DEFAULT_ABOUT: AboutData = {
  title: 'À propos',
  paragraphs: [
    "AD Sport Solutions est votre boutique en ligne spécialisée dans les articles de sport : maillots, chaussures, ballons, équipements de musculation et bien plus.",
    "Notre objectif : rendre le sport accessible à tous, avec des produits de qualité et une livraison rapide.",
  ],
  image: "", // <-- Ajouté
};

export function parseAbout(raw?: string): AboutData {
  if (!raw) return DEFAULT_ABOUT;
  try {
    const p = JSON.parse(raw);
    if (p && typeof p.title === 'string' && Array.isArray(p.paragraphs)) {
      return {
        title: p.title,
        paragraphs: p.paragraphs.filter((x: unknown) => typeof x === 'string'),
        image: typeof p.image === 'string' ? p.image : '',
      };
    }
  } catch {}
  return DEFAULT_ABOUT;
}

export async function getAbout(): Promise<AboutData> {
  try {
    const settings = await getSettings();
    return parseAbout(settings.about);
  } catch {
    return DEFAULT_ABOUT;
  }
}