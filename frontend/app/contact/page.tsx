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
    <main className="min-h-screen bg-canvas py-12 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
            Contactez-nous
          </h1>
          <p className="mt-3 text-ink/60 max-w-2xl">
            {s.contact_intro || "Une question ? Une remarque ? Notre équipe est là pour vous aider. N'hésitez pas à nous contacter, nous vous répondons dans les plus brefs délais."}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Colonne de gauche : Coordonnées */}
          <div className="bg-white rounded-2xl border border-line p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-action-soft text-action flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h2 className="text-xl font-bold text-ink">Nos coordonnées</h2>
            </div>

            <div className="space-y-6">
              {s.contact_email && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-canvas text-ink/60 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Email</p>
                    <a href={`mailto:${s.contact_email}`} className="text-sm text-ink/60 hover:text-action transition">
                      {s.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {s.contact_phone && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-canvas text-ink/60 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Téléphone</p>
                    <a href={`tel:${s.contact_phone}`} className="text-sm text-ink/60 hover:text-action transition">
                      {s.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {s.social_whatsapp && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-canvas text-ink/60 flex items-center justify-center shrink-0">
                    {/* Vrai logo WhatsApp en SVG */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink mb-1">WhatsApp</p>
                    <a 
                      href={`https://wa.me/${s.social_whatsapp.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-action text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-action-dark transition"
                    >
                      Nous écrire
                      <Navigation size={12} />
                    </a>
                  </div>
                </div>
              )}

              {s.contact_address && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-canvas text-ink/60 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Adresse</p>
                    <p className="text-sm text-ink/60">
                      {s.contact_address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colonne de droite : Carte */}
          <div className="bg-white rounded-2xl border border-line p-4 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4 px-2 pt-2">
              <MapPin size={20} className="text-action" />
              <h2 className="text-xl font-bold text-ink">Nous trouver</h2>
            </div>
            
            {s.contact_lat && s.contact_lng ? (() => {
              const lat = Number(s.contact_lat);
              const lng = Number(s.contact_lng);
              const d = 0.005;
              const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
              return (
                <div className="flex-1 flex flex-col">
                  <iframe 
                    src={src} 
                    className="w-full h-64 md:h-full min-h-[250px] rounded-xl border border-line" 
                    loading="lazy" 
                    title="Notre emplacement" 
                  />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-action hover:underline px-2"
                  >
                    <Navigation size={16} />
                    Obtenir l'itinéraire
                  </a>
                </div>
              );
            })() : (
              <div className="flex-1 bg-canvas rounded-xl flex items-center justify-center text-ink/40 text-sm">
                Carte non disponible
              </div>
            )}
          </div>
        </div>

        {/* Formulaire (pleine largeur en bas) */}
        <div className="mt-8 bg-white rounded-2xl border border-line p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-action text-white flex items-center justify-center">
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