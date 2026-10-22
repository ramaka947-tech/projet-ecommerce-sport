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
    <main className="min-h-screen bg-canvas text-ink">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* En-tête */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-success-soft flex items-center justify-center">
            <Check size={40} className="text-success" strokeWidth={3} />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold">Commande confirmée !</h1>
          <p className="mt-3 text-ink/60 leading-relaxed">
            Merci {order.customerName}, votre commande a bien été enregistrée.
          </p>
        </div>

        <div className="mt-8">
          <ConfirmationActions orderNumber={order.orderNumber} phone={order.customerPhone} />
        </div>

        {/* Récapitulatif */}
        <div className="mt-5 bg-white rounded-2xl border border-line p-6 sm:p-7 text-left">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-full bg-action-soft text-action flex items-center justify-center">
              <Package size={20} />
            </span>
            <h2 className="text-lg font-bold">Récapitulatif de la commande</h2>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-6 sm:gap-0">
            {/* Total + paiement */}
            <div className="space-y-5 sm:pr-7">
              <div>
                <p className="text-sm text-ink/60">Total</p>
                <p className="mt-0.5 text-3xl font-bold text-action">
                  {Number(order.total).toLocaleString('fr-FR')} {currency}
                </p>
              </div>

              <div className="border-t border-line pt-5 flex gap-3">
                <CreditCard size={20} className="shrink-0 mt-0.5 text-ink/60" />
                <div className="min-w-0">
                  <p className="text-sm text-ink/60">Mode de paiement</p>
                  <p className="mt-0.5 font-semibold">{order.paymentMethod}</p>
                  {method?.instructions && (
                    <p className="mt-1 text-sm text-ink/60 whitespace-pre-line">
                      {method.instructions}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Livraison */}
            <div className="sm:border-l sm:border-line sm:pl-7 flex gap-3">
              <MapPin size={20} className="shrink-0 mt-0.5 text-action" />
              <div className="min-w-0">
                <p className="text-sm text-ink/60">Livraison</p>
                <p className="mt-0.5 font-semibold leading-snug">
                  {order.customerAddress}, {order.city}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/boutique"
            className="inline-flex items-center justify-center gap-2.5 bg-action hover:bg-action-dark text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
          >
            <ShoppingBag size={19} />
            Retour à la boutique
          </Link>
        </div>
      </div>
    </main>
  );
}