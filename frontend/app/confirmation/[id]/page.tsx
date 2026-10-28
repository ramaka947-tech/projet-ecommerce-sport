import { getOrderById, getSettings, getPaymentMethods } from '@/lib/api';
import Link from 'next/link';
import { Check, CreditCard, MapPin, Package, ShoppingBag } from 'lucide-react';
import ConfirmationActions from './confirmation-actions';

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, settings, methods] = await Promise.all([
    getOrderById(id),
    getSettings().catch(() => ({}) as Record<string, string>),
    getPaymentMethods().catch(() => [] as any[]),
  ]);
  const currency = settings.currency || 'FCFA';
  const method = methods.find((m: any) => m.name === order.paymentMethod);

  return (
    <main className="bg-canvas text-ink md:min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-14">
        {/* En-tête */}
        <div className="text-center">
          <div className="mx-auto size-16 sm:size-20 rounded-full bg-success-soft flex items-center justify-center">
            <Check className="size-8 sm:size-10 text-success" strokeWidth={3} />
          </div>
          <h1 className="mt-4 sm:mt-6 text-2xl sm:text-4xl font-bold text-balance">
            Commande confirmée !
          </h1>
          <p className="mt-2 sm:mt-3 text-ink/70 sm:text-ink/60 leading-relaxed break-words">
            Merci {order.customerName}, votre commande a bien été enregistrée.
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
          <ConfirmationActions orderNumber={order.orderNumber} phone={order.customerPhone} />
        </div>

        {/* Récapitulatif */}
        <div className="mt-4 sm:mt-5 bg-white rounded-2xl border border-line p-4 sm:p-7 text-left">
          <div className="flex items-center gap-3">
            <span className="size-10 shrink-0 rounded-full bg-action-soft text-action flex items-center justify-center">
              <Package size={20} />
            </span>
            <h2 className="text-base sm:text-lg font-bold">Récapitulatif de la commande</h2>
          </div>

          <div className="mt-5 sm:mt-6 grid sm:grid-cols-2 gap-5 sm:gap-0">
            {/* Total + paiement */}
            <div className="space-y-5 sm:pr-7 min-w-0">
              <div>
                <p className="text-sm text-ink/70 sm:text-ink/60">Total</p>
                <p className="mt-0.5 text-3xl font-bold text-action break-words">
                  {Number(order.total).toLocaleString('fr-FR')} {currency}
                </p>
              </div>

              <div className="border-t border-line pt-5 flex gap-3">
                <CreditCard size={20} className="shrink-0 mt-0.5 text-ink/60" />
                <div className="min-w-0">
                  <p className="text-sm text-ink/70 sm:text-ink/60">Mode de paiement</p>
                  <p className="mt-0.5 font-semibold break-words">{order.paymentMethod}</p>
                  {method?.instructions && (
                    <p className="mt-1 text-sm text-ink/70 sm:text-ink/60 whitespace-pre-line break-words">
                      {method.instructions}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Livraison : sous le paiement sur mobile, à droite dès sm */}
            <div className="min-w-0 border-t border-line pt-5 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-7 flex gap-3">
              <MapPin size={20} className="shrink-0 mt-0.5 text-action" />
              <div className="min-w-0">
                <p className="text-sm text-ink/70 sm:text-ink/60">Livraison</p>
                <p className="mt-0.5 font-semibold leading-snug break-words">
                  {order.customerAddress}, {order.city}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/boutique"
            className="flex w-full sm:w-auto min-h-12 touch-manipulation items-center justify-center gap-2.5 bg-action active:bg-action-dark md:hover:bg-action-dark text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
          >
            <ShoppingBag size={19} />
            Retour à la boutique
          </Link>
        </div>
      </div>
    </main>
  );
}