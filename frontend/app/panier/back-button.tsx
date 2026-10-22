'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  const goBack = () => {
    // Revient à la page précédente ; si on est arrivé directement sur cette page, va à la boutique
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/boutique');
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="group inline-flex items-center gap-2.5 text-sm font-semibold text-ink hover:text-action transition-colors"
    >
      <span className="w-9 h-9 rounded-full bg-white border border-line group-hover:border-action flex items-center justify-center transition-colors">
        <ChevronLeft size={20} />
      </span>
      Retour
    </button>
  );
}