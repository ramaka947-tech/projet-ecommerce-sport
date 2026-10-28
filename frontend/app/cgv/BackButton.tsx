'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  const goBack = () => {
    if (typeof window === 'undefined') return;

    // On ne revient en arrière que si la page précédente est une page du site.
    // Si le visiteur arrive depuis WhatsApp, Facebook, Google ou un lien direct,
    // router.back() le ferait quitter la boutique.
    let cameFromSite = false;
    try {
      cameFromSite =
        !!document.referrer &&
        new URL(document.referrer).origin === window.location.origin;
    } catch {}

    if (cameFromSite && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition active:border-action active:text-action md:min-h-0 md:px-3 md:hover:border-action md:hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
    >
      <ArrowLeft className="size-4" />
      Retour
    </button>
  );
}