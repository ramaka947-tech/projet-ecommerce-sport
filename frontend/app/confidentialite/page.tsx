import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { getLegalMeta } from '@/lib/legal';

const meta = getLegalMeta('confidentialite');

export const metadata: Metadata = {
  title: `${meta.title} | AD Sport Solutions`,
  description: meta.description,
};

export default function Page() {
  return <LegalPage slug="confidentialite" />;
}