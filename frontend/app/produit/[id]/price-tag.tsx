'use client';

import { useCurrency } from '@/lib/currency';

export default function PriceTag({
  price,
  promoPrice,
}: {
  price: number;
  promoPrice?: number | null;
}) {
  const { formatPrice } = useCurrency();
  const hasPromo = !!promoPrice;
  const discount = hasPromo ? Math.round((1 - Number(promoPrice) / price) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {hasPromo ? (
        <>
          <span className="text-2xl sm:text-3xl font-extrabold text-alert">
            {formatPrice(Number(promoPrice))}
          </span>
          <span className="text-base sm:text-lg text-ink/40 line-through">
            {formatPrice(price)}
          </span>
          <span className="rounded-full bg-alert text-white text-xs font-bold px-2.5 py-1">
            -{discount}%
          </span>
        </>
      ) : (
        <span className="text-2xl sm:text-3xl font-extrabold text-ink">
          {formatPrice(price)}
        </span>
      )}
    </div>
  );
}