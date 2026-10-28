'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, FileText, Truck } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { rememberOrder, trackingUrl } from '@/lib/recent-orders';

type CopyState = 'idle' | 'ok' | 'fail';

export default function ConfirmationActions({
  orderNumber,
  phone,
}: {
  orderNumber: string;
  phone: string;
}) {
  const { isLoggedIn } = useCustomerAuth();
  const [copy, setCopy] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On garde la commande sur l'appareil pour la retrouver en un clic
  useEffect(() => {
    rememberOrder(orderNumber, phone);
  }, [orderNumber, phone]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copyNumber = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(orderNumber);
      ok = true;
    } catch {
      // Navigateurs intégrés (WhatsApp, Facebook) ou page non sécurisée : méthode de secours
      try {
        const ta = document.createElement('textarea');
        ta.value = orderNumber;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.fontSize = '16px'; // évite le zoom iOS
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
    setCopy(ok ? 'ok' : 'fail');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopy('idle'), ok ? 2000 : 4000);
  };

  return (
    <>
      {/* Numéro de commande */}
      <div className="bg-white rounded-2xl border border-line p-4 sm:p-7 text-left flex gap-5">
        <span className="hidden sm:flex size-12 shrink-0 rounded-full bg-action-soft text-action items-center justify-center">
          <FileText size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink/70 sm:text-ink/60">Numéro de commande</p>
          {/* select-all : un appui long sélectionne tout le numéro */}
          <p className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-wide text-ink break-all select-all">
            {orderNumber}
          </p>

          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <button
              type="button"
              onClick={copyNumber}
              className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 text-sm font-semibold border border-line rounded-xl px-4 py-2.5 transition active:border-action active:text-action md:hover:border-action md:hover:text-action"
            >
              {copy === 'ok' ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              {copy === 'ok' ? 'Copié' : 'Copier le numéro'}
            </button>

            {/* Action principale en premier sur mobile, en second dès sm (comme avant) */}
            <Link
              href={trackingUrl(orderNumber, phone)}
              className="order-first sm:order-none inline-flex min-h-12 sm:min-h-11 touch-manipulation items-center justify-center gap-2 text-sm font-semibold bg-action active:bg-action-dark md:hover:bg-action-dark text-white rounded-xl px-4 py-2.5 transition-colors"
            >
              <Truck size={16} />
              Suivre ma commande
            </Link>
          </div>

          <p role="status" aria-live="polite" className="empty:hidden mt-3 text-sm text-alert">
            {copy === 'fail' && 'Copie impossible : appuyez longuement sur le numéro pour le copier.'}
          </p>

          <p className="mt-4 text-sm text-ink/70 sm:text-ink/55 leading-relaxed">
            Gardez ce numéro. Avec le téléphone utilisé pour commander, il permet de suivre la
            commande depuis n'importe quel appareil.
          </p>
        </div>
      </div>

      {/* Invitation à créer un compte */}
      {!isLoggedIn && (
        <div className="mt-4 rounded-2xl bg-white border border-line p-4 sm:p-5 text-left">
          <p className="font-semibold text-ink">Retrouvez tout sur tous vos appareils</p>
          <p className="mt-1 text-sm text-ink/70 sm:text-ink/60">
            Avec un compte, vos commandes, votre panier et vos favoris vous suivent sur
            n'importe quel téléphone.
          </p>
          <Link
            href="/compte/connexion"
            className="mt-1 sm:mt-2 inline-flex min-h-11 touch-manipulation items-center text-sm font-semibold text-action active:text-action-dark md:hover:underline"
          >
            Se connecter ou créer un compte
          </Link>
        </div>
      )}
    </>
  );
}