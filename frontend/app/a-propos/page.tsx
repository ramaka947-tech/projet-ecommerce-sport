'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { getAbout, AboutData } from '@/lib/about';

// Bouton de retour identique à celui de la page Connexion
function BackLink() {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-action hover:text-action"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </button>
  );
}

export default function AboutPage() {
  const [about, setAbout] = useState<AboutData | null>(null);

  useEffect(() => {
    getAbout().then(setAbout);
  }, []);

  if (!about) {
    return (
      <main className="min-h-screen bg-canvas p-8">
        <p className="text-gray-500">Chargement...</p>
      </main>
    );
  }

  const hasImage = !!about.image;

  return (
    <main className="min-h-screen bg-canvas py-6 sm:py-8 px-4 sm:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Bouton Retour */}
        <div className="mb-10">
          <BackLink />
        </div>

        <div
          className={`grid gap-10 lg:gap-16 items-start ${
            hasImage ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'
          }`}
        >
          {/* Texte */}
          <div>
            <span className="block w-14 h-1 bg-action rounded-full mb-4" />
            <h1 className="text-5xl md:text-6xl font-black text-ink tracking-tight mb-8">
              {about.title}
            </h1>

            <div className="space-y-6">
              {about.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={`whitespace-pre-line leading-relaxed ${
                    i === 0
                      ? 'text-xl md:text-2xl text-ink'
                      : 'text-lg md:text-xl text-ink/60'
                  }`}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>

          {/* Image */}
          {hasImage && (
            <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-xl">
              <img
                src={about.image}
                alt={about.title}
                className="w-full h-full object-contain bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}