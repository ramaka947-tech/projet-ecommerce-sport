import { getCompany } from './company';
import { conditionsUtilisation } from './conditions-utilisation';
import { confidentialite } from './confidentialite';
import { cookies } from './cookies';

export { getCompany };

// Pour ajouter une page : créer le fichier de contenu, la route, puis une ligne ici.
export const LEGAL_PAGES = {
  'conditions-utilisation': conditionsUtilisation,
  confidentialite,
  cookies,
} as const;

export type LegalSlug = keyof typeof LEGAL_PAGES;

// Titre/description : ne dépendent pas des réglages admin
export const getLegalMeta = (slug: LegalSlug) => {
  const { title, description } = LEGAL_PAGES[slug](getCompany());
  return { title, description };
};

export const LEGAL_LINKS = [
  { href: '/cgv', label: 'CGV' },
  ...(Object.keys(LEGAL_PAGES) as LegalSlug[]).map((slug) => ({
    href: `/${slug}`,
    label: getLegalMeta(slug).title,
  })),
];