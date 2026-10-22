import { getCgv } from '@/lib/cgv';
import BackButton from './BackButton';

export const dynamic = 'force-dynamic';

export default async function CgvPage() {
  const sections = await getCgv();

  return (
    <main className="min-h-screen bg-canvas py-6 sm:py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Bouton Retour */}
        <div className="mb-10">
          <BackButton />
        </div>

        {/* Titre avec le petit trait rouge */}
        <span className="block w-14 h-1 bg-action rounded-full mb-4" />
        <h1 className="text-4xl md:text-5xl font-black text-ink tracking-tight mb-10">
          Conditions Générales de Vente
        </h1>

        {/* Sections */}
        <div className="space-y-5">
          {sections.map((s, i) => (
            <section
              key={i}
              className="rounded-2xl border border-line bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                {/* Numéro */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-action text-sm font-bold text-white">
                  {i + 1}
                </span>

                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-ink mb-2">
                    {s.title}
                  </h2>
                  <p className="text-base md:text-lg leading-relaxed text-ink/70 whitespace-pre-line">
                    {s.content}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}