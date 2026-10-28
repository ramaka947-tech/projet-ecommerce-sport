// app/contact/page.tsx
import { Mail, Phone, MapPin, Navigation, MessageSquare } from 'lucide-react';
import { getSettings } from '@/lib/api';
import ContactForm from './contact-form';

export default async function ContactPage() {
  let s: Record<string, string> = {};
  try {
    s = await getSettings();
  } catch {}

  return (
    <main className="bg-canvas px-4 py-6 sm:px-6 md:min-h-screen md:py-12">
      <div className="mx-auto max-w-5xl">

        {/* En-tête */}
        <div className="mb-6 md:mb-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink text-balance sm:text-3xl md:text-4xl">
            Contactez-nous
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70 md:text-ink/60">
            {s.contact_intro || "Une question ? Une remarque ? Notre équipe est là pour vous aider. N'hésitez pas à nous contacter, nous vous répondons dans les plus brefs délais."}
          </p>
        </div>

        <div className="grid gap-5 md:gap-8 lg:grid-cols-2">

          {/* Colonne de gauche : Coordonnées */}
          <div className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-sm md:p-8">
            <div className="mb-5 flex items-center gap-3 md:mb-6">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action-soft text-action">
                <MapPin size={20} />
              </div>
              <h2 className="text-xl font-bold text-ink">Nos coordonnées</h2>
            </div>

            <div className="space-y-5 md:space-y-6">
              {s.contact_email && (
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 md:text-ink/60">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Email</p>
                    <a
                      href={`mailto:${s.contact_email}`}
                      className="inline-block touch-manipulation break-words py-2.5 text-sm text-ink/70 transition active:text-action md:py-0 md:text-ink/60 md:hover:text-action"
                    >
                      {s.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {s.contact_phone && (
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 md:text-ink/60">
                    <Phone size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Téléphone</p>
                    <a
                      href={`tel:${s.contact_phone.replace(/\s/g, '')}`}
                      className="inline-block touch-manipulation break-words py-2.5 text-sm text-ink/70 transition active:text-action md:py-0 md:text-ink/60 md:hover:text-action"
                    >
                      {s.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {s.social_whatsapp && (
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 md:text-ink/60">
                    {/* Vrai logo WhatsApp en SVG */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-sm font-semibold text-ink">WhatsApp</p>
                    <a
                      href={`https://wa.me/${s.social_whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-lg bg-action px-5 text-sm font-semibold text-white transition active:bg-action-dark md:min-h-0 md:gap-1.5 md:rounded-md md:px-3 md:py-1.5 md:text-xs md:hover:bg-action-dark"
                    >
                      Nous écrire
                      <Navigation size={12} aria-hidden="true" />
                    </a>
                  </div>
                </div>
              )}

              {s.contact_address && (
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 md:text-ink/60">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Adresse</p>
                    <p className="break-words text-sm text-ink/70 md:text-ink/60">
                      {s.contact_address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colonne de droite : Carte */}
          <div className="flex min-w-0 flex-col rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3 px-2 pt-2">
              <MapPin size={20} className="text-action" />
              <h2 className="text-xl font-bold text-ink">Nous trouver</h2>
            </div>

            {s.contact_lat && s.contact_lng ? (() => {
              const lat = Number(s.contact_lat);
              const lng = Number(s.contact_lng);
              const d = 0.005;
              const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
              return (
                <div className="flex flex-1 flex-col">
                  {/* Sur mobile, la carte ne capte pas le doigt : on peut faire défiler la page
                      sans rester « bloqué » dans la carte. Le bouton d'itinéraire ouvre la vraie carte. */}
                  <iframe
                    src={src}
                    className="pointer-events-none h-56 min-h-56 w-full rounded-xl border border-line sm:h-64 md:pointer-events-auto md:h-full md:min-h-62.5"
                    loading="lazy"
                    title="Notre emplacement"
                  />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-action text-sm font-semibold text-action active:bg-action-soft md:min-h-0 md:w-auto md:justify-start md:border-0 md:px-2 md:active:bg-transparent md:hover:underline"
                  >
                    <Navigation size={16} aria-hidden="true" />
                    Obtenir l&apos;itinéraire
                  </a>
                </div>
              );
            })() : (
              <div className="flex min-h-32 flex-1 items-center justify-center rounded-xl bg-canvas text-sm text-ink/70 md:min-h-0 md:text-ink/40">
                Carte non disponible
              </div>
            )}
          </div>
        </div>

        {/* Formulaire (pleine largeur en bas) */}
        <div className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-sm md:mt-8 md:p-8">
          <div className="mb-6 flex items-center gap-3 md:mb-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action text-white">
              <MessageSquare size={20} />
            </div>
            <h2 className="text-xl font-bold text-ink">Envoyez-nous un message</h2>
          </div>

          <ContactForm />
        </div>

      </div>
    </main>
  );
}