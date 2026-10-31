'use client';
import { useEffect, useState } from 'react';
import { getSettings } from '@/lib/api';
import BackButton from '@/app/cgv/BackButton';
import { LEGAL_PAGES, getCompany, type LegalSlug } from '@/lib/legal';
import type { Settings } from '@/lib/legal/company';

export default function LegalPage({ slug }: { slug: LegalSlug }) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings({}));
  }, []);

  const doc = LEGAL_PAGES[slug](getCompany(settings ?? {}));

  return (
    <main className="md:min-h-screen bg-canvas py-6 sm:py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 md:mb-10">
          <BackButton />
        </div>

        <span className="block w-12 md:w-14 h-1 bg-action rounded-full mb-3 md:mb-4" />
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-ink tracking-tight text-balance break-words mb-6 md:mb-10">
          {doc.title}
        </h1>

        {settings === null ? (
          <div className="space-y-3 md:space-y-5" aria-busy="true">
            {doc.sections.slice(0, 4).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-line bg-white shadow-sm"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 md:space-y-5">
            {doc.sections.map((s, i) => (
              <section
                key={i}
                className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5 md:items-start md:gap-x-4 md:gap-y-2 rounded-2xl border border-line bg-white p-4 sm:p-6 shadow-sm"
              >
                <span className="flex size-8 md:size-9 md:row-span-2 shrink-0 items-center justify-center rounded-full bg-action text-sm font-bold text-white">
                  {i + 1}
                </span>

                <h2 className="min-w-0 text-lg sm:text-xl md:text-2xl font-bold leading-snug text-ink break-words">
                  {s.title}
                </h2>

                <p className="col-span-2 md:col-span-1 md:col-start-2 min-w-0 text-base md:text-lg leading-relaxed text-ink/80 md:text-ink/70 whitespace-pre-line break-words">
                  {s.content}
                </p>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}