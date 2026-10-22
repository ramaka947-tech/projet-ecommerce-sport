'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, FileText, Truck } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { rememberOrder, trackingUrl } from '@/lib/recent-orders';

export default function ConfirmationActions({
  orderNumber,
  phone,
}: {
  orderNumber: string;
  phone: string;
}) {
  const { isLoggedIn } = useCustomerAuth();
  const [copied, setCopied] = useState(false);

  // On garde la commande sur l'appareil pour la retrouver en un clic
  useEffect(() => {
    rememberOrder(orderNumber, phone);
  }, [orderNumber, phone]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      {/* Numéro de commande */}
      <div className="bg-white rounded-2xl border border-line p-6 sm:p-7 text-left flex gap-5">
        <span className="hidden sm:flex w-12 h-12 shrink-0 rounded-full bg-action-soft text-action items-center justify-center">
          <FileText size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink/60">Numéro de commande</p>
          <p className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-wide text-ink break-all">
            {orderNumber}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 text-sm font-semibold border border-line rounded-xl px-4 py-2.5 hover:border-action hover:text-action transition"
            >
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              {copied ? 'Copié' : 'Copier le numéro'}
            </button>
            <Link
              href={trackingUrl(orderNumber, phone)}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-action hover:bg-action-dark text-white rounded-xl px-4 py-2.5 transition-colors"
            >
              <Truck size={16} />
              Suivre ma commande
            </Link>
          </div>

          <p className="mt-4 text-sm text-ink/55 leading-relaxed">
            Gardez ce numéro. Avec le téléphone utilisé pour commander, il permet de suivre la
            commande depuis n'importe quel appareil.
          </p>
        </div>
      </div>

      {/* Invitation à créer un compte */}
      {!isLoggedIn && (
        <div className="mt-4 rounded-2xl bg-white border border-line p-5 text-left">
          <p className="font-semibold text-ink">Retrouvez tout sur tous vos appareils</p>
          <p className="mt-1 text-sm text-ink/60">
            Avec un compte, vos commandes, votre panier et vos favoris vous suivent sur
            n'importe quel téléphone.
          </p>
          <Link
            href="/compte/connexion"
            className="inline-block mt-3 text-sm font-semibold text-action hover:underline"
          >
            Se connecter ou créer un compte
          </Link>
        </div>
      )}
    </>
  );
}