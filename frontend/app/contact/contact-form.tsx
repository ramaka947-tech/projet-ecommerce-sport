'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Edit3, Send, Loader2 } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { sendContactMessage } from '@/lib/api';

export default function ContactForm() {
  const { customer } = useCustomerAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        name: f.name || customer.name || '',
        email: f.email || customer.email || '',
      }));
    }
  }, [customer]);

  // Sur téléphone, le bouton « Envoyer » est loin du haut du formulaire :
  // on ramène le message de confirmation / d'erreur à l'écran.
  useEffect(() => {
    if ((success || error) && statusRef.current) {
      statusRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [success, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await sendContactMessage({
        name: form.name,
        email: form.email,
        subject: form.subject,
        content: form.message,
        customerId: customer?.id, // Envoie l'ID du compte client pour lier
      });
      setSuccess(true);
      setForm((f) => ({ ...f, subject: '', message: '' }));
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Une erreur est survenue lors de l'envoi."
      );
    } finally {
      setLoading(false);
    }
  };

  // 16 px sur mobile (évite le zoom iOS), taille d'origine dès md
  const inputClass =
    'w-full min-h-12 border border-line rounded-lg pl-10 pr-3 py-2.5 text-base md:min-h-0 md:text-sm focus:outline-none focus:border-action bg-white text-ink placeholder:text-gray-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div ref={statusRef} className="space-y-5 empty:hidden scroll-mt-24">
        {success && (
          <div
            role="status"
            className="break-words rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
          >
            ✓ Votre message a bien été envoyé. Nous vous répondrons rapidement !
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="break-words rounded-lg border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert"
          >
            {error}
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold text-ink">
            Nom complet *
          </label>
          <div className="relative">
            <User size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              id="contact-name"
              name="name"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Votre nom complet"
            />
          </div>
        </div>
        <div className="min-w-0">
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold text-ink">
            Adresse e-mail *
          </label>
          <div className="relative">
            <Mail size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              id="contact-email"
              name="email"
              required
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="votre@email.com"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-semibold text-ink">
          Sujet *
        </label>
        <select
          id="contact-subject"
          name="subject"
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="min-h-12 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus:border-action focus:outline-none md:min-h-0 md:text-sm"
        >
          <option value="">Choisissez un sujet</option>
          <option value="commande">Question sur une commande</option>
          <option value="produit">Question sur un produit</option>
          <option value="livraison">Problème de livraison</option>
          <option value="autre">Autre demande</option>
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold text-ink">
          Message *
        </label>
        <div className="relative">
          <Edit3 size={16} aria-hidden="true" className="absolute left-3.5 top-3 text-ink/40" />
          <textarea
            id="contact-message"
            name="message"
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full resize-none rounded-lg border border-line bg-white py-2.5 pl-10 pr-3 text-base text-ink placeholder:text-gray-500 focus:border-action focus:outline-none md:text-sm"
            placeholder="Écrivez votre message ici..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-lg bg-action px-6 py-3 font-semibold text-white transition active:bg-action-dark disabled:opacity-50 md:min-h-0 md:w-auto md:hover:bg-action-dark"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Envoi en cours...
          </>
        ) : (
          <>
            Envoyer le message
            <Send size={16} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}