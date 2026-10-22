'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        name: f.name || customer.name || '',
        email: f.email || customer.email || '',
      }));
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setForm({ ...form, subject: '', message: '' }); 
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-line rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-action bg-white';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div className="bg-success-soft border border-success/30 text-success text-sm px-4 py-3 rounded-lg">
          ✓ Votre message a bien été envoyé. Nous vous répondrons rapidement !
        </div>
      )}
      {error && (
        <div className="bg-alert/10 border border-alert/30 text-alert text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-ink">
            Nom complet *
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Votre nom complet"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-ink">
            Adresse e-mail *
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="votre@email.com"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-ink">
          Sujet *
        </label>
        <select
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-action bg-white text-ink"
        >
          <option value="">Choisissez un sujet</option>
          <option value="commande">Question sur une commande</option>
          <option value="produit">Question sur un produit</option>
          <option value="livraison">Problème de livraison</option>
          <option value="autre">Autre demande</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-ink">
          Message *
        </label>
        <div className="relative">
          <Edit3 size={16} className="absolute left-3.5 top-3 text-ink/40" />
          <textarea
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full border border-line rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-action bg-white resize-none"
            placeholder="Écrivez votre message ici..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 bg-action text-white font-semibold px-6 py-3 rounded-lg hover:bg-action-dark transition disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            Envoyer le message
            <Send size={16} />
          </>
        )}
      </button>
    </form>
  );
}