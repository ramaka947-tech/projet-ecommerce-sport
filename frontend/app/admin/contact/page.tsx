'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminGuard from '@/lib/admin-guard';
import { getSettings, updateSettings } from '@/lib/api';
import type { Location } from '@/components/LocationPicker';
import { 
  Mail, Phone, MessageCircle, MapPin, Loader2, CheckCircle2, 
  Share2, User, ExternalLink
} from 'lucide-react';

// Leaflet a besoin de `window` : on le charge uniquement côté navigateur
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-ink/50 text-sm bg-canvas rounded-xl">Chargement de la carte...</div>,
});

// Vraies icônes SVG pour les réseaux
const WhatsAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);
const InstaIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
const FbIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const TiktokIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
  </svg>
);

export default function AdminContactPage() {
  const [form, setForm] = useState({
    contact_intro: '',
    contact_email: '',
    contact_phone: '',
    social_whatsapp: '',
    social_instagram: '',
    social_facebook: '',
    social_tiktok: '',
  });
  const [location, setLocation] = useState<Location>({ address: '', lat: '', lng: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getSettings()
      .then((s: Record<string, string>) => {
        setForm({
          contact_intro: s.contact_intro ?? '',
          contact_email: s.contact_email ?? '',
          contact_phone: s.contact_phone ?? '',
          social_whatsapp: s.social_whatsapp ?? '',
          social_instagram: s.social_instagram ?? '',
          social_facebook: s.social_facebook ?? '',
          social_tiktok: s.social_tiktok ?? '',
        });
        setLocation({
          address: s.contact_address ?? '',
          lat: s.contact_lat ?? '',
          lng: s.contact_lng ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await updateSettings({
        ...form,
        contact_address: location.address,
        contact_lat: location.lat,
        contact_lng: location.lng,
      });
      setMsg({ ok: true, text: 'Informations enregistrées avec succès.' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-action bg-white";
  const labelCls = "block text-sm font-semibold mb-1.5 text-ink flex items-center gap-2";

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-action" size={32} /></div>;

  return (
    <AdminGuard>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-action/10 text-action flex items-center justify-center">
            <MapPin size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">Contact</h1>
            <p className="text-sm text-ink/60">Gérez les coordonnées et l'emplacement affichés sur la page contact de votre site.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-6xl space-y-6">
        
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* COLONNE GAUCHE : Coordonnées */}
          <section className="bg-white border border-line rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink mb-5 border-b border-line pb-3 flex items-center gap-2">
              <User size={18} className="text-action" /> Coordonnées
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Texte d'introduction</label>
                <textarea
                  rows={3}
                  value={form.contact_intro}
                  onChange={(e) => setForm({ ...form, contact_intro: e.target.value })}
                  className={`${inputCls} resize-none`}
                  placeholder="Une question ? Notre équipe est à votre écoute..."
                />
              </div>

              <div>
                <label className={labelCls}><Mail size={14} className="text-ink/40" /> Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}><Phone size={14} className="text-ink/40" /> Téléphone</label>
                <input
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}><WhatsAppIcon /> WhatsApp (avec indicatif)</label>
                <input
                  value={form.social_whatsapp}
                  onChange={(e) => setForm({ ...form, social_whatsapp: e.target.value })}
                  placeholder="Ex : 221781129852"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* COLONNE DROITE : Réseaux Sociaux */}
          <section className="bg-white border border-line rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink mb-5 border-b border-line pb-3 flex items-center gap-2">
              <Share2 size={18} className="text-action" /> Réseaux sociaux
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className={labelCls}><WhatsAppIcon /> WhatsApp (avec indicatif)</label>
                <input
                  value={form.social_whatsapp}
                  onChange={(e) => setForm({ ...form, social_whatsapp: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}><InstaIcon /> Instagram</label>
                <input
                  value={form.social_instagram}
                  onChange={(e) => setForm({ ...form, social_instagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}><FbIcon /> Facebook</label>
                <input
                  value={form.social_facebook}
                  onChange={(e) => setForm({ ...form, social_facebook: e.target.value })}
                  placeholder="https://facebook.com/..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}><TiktokIcon /> TikTok</label>
                <input
                  value={form.social_tiktok}
                  onChange={(e) => setForm({ ...form, social_tiktok: e.target.value })}
                  placeholder="https://tiktok.com/@..."
                  className={inputCls}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Localisation (pleine largeur en bas) */}
        <section className="bg-white border border-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink mb-5 border-b border-line pb-3 flex items-center gap-2">
            <MapPin size={18} className="text-action" /> Emplacement de la boutique
          </h2>
          
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-line h-64">
              <LocationPicker value={location} onChange={setLocation} />
            </div>
            
            {/* Affichage de l'adresse enregistrée en bas de la carte */}
            {location.address && (
              <div className="flex items-center gap-3 p-4 bg-canvas/50 border border-line rounded-xl text-sm text-ink">
                <MapPin size={18} className="text-action shrink-0" />
                <p className="flex-1">{location.address}</p>
                <a 
                  href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-white rounded-lg transition"
                  title="Voir sur Google Maps"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Messages d'état & Bouton Enregistrer */}
        {msg && (
          <div className={`p-4 rounded-xl border flex items-center gap-2 font-medium text-sm ${msg.ok ? 'bg-success-soft border-success/20 text-success' : 'bg-action-soft border-action/20 text-action'}`}>
            {msg.ok && <CheckCircle2 size={18} />}
            {msg.text}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-action text-white font-bold px-8 py-3 rounded-xl hover:bg-action-dark transition shadow-sm disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </AdminGuard>
  );
}