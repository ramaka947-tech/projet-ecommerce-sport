import { getCgv } from '@/lib/cgv';
import BackButton from './BackButton';

export const dynamic = 'force-dynamic';

export default async function CgvPage() {
  const sections = await getCgv();

  return (
    <main className="md:min-h-screen bg-canvas py-6 sm:py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Bouton Retour */}
        <div className="mb-6 md:mb-10">
          <BackButton />
        </div>

        {/* Titre avec le petit trait rouge */}
        <span className="block w-12 md:w-14 h-1 bg-action rounded-full mb-3 md:mb-4" />
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-ink tracking-tight text-balance break-words mb-6 md:mb-10">
          Conditions Générales de Vente
        </h1>

        {/* Sections */}
        {sections.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-4 sm:p-6 text-base text-ink/70 shadow-sm">
            Les conditions générales de vente ne sont pas disponibles pour le moment.
          </p>
        ) : (
          <div className="space-y-3 md:space-y-5">
            {sections.map((s, i) => (
              <section
                key={i}
                className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5 md:items-start md:gap-x-4 md:gap-y-2 rounded-2xl border border-line bg-white p-4 sm:p-6 shadow-sm"
              >
                {/* Numéro : à côté du titre sur mobile, en colonne dès md */}
                <span className="flex size-8 md:size-9 md:row-span-2 shrink-0 items-center justify-center rounded-full bg-action text-sm font-bold text-white">
                  {i + 1}
                </span>

                <h2 className="min-w-0 text-lg sm:text-xl md:text-2xl font-bold leading-snug text-ink break-words">
                  {s.title}
                </h2>

                {/* Texte : pleine largeur sous le titre sur mobile */}
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