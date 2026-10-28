'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type Props = {
  /** Page vers laquelle aller si on ne peut pas revenir en arrière */
  fallback?: string;
  label?: string;
  /** Pour les marges, ex. "mb-4 md:mb-6" */
  className?: string;
};

export default function BackButton({
  fallback = '/boutique',
  label = 'Retour',
  className = '',
}: Props) {
  const router = useRouter();

  const goBack = () => {
    // On ne revient en arrière que si le visiteur vient de notre propre site.
    // Sinon (WhatsApp, Facebook, Google...), router.back() le renverrait ailleurs.
    try {
      if (
        document.referrer &&
        new URL(document.referrer).origin === window.location.origin &&
        window.history.length > 1
      ) {
        router.back();
        return;
      }
    } catch {
      // URL invalide : on utilise la page de secours
    }
    router.push(fallback);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition active:border-action active:text-action md:min-h-0 md:px-3 md:hover:border-action md:hover:text-action ${className}`}
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}