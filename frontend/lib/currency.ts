'use client';
import { useEffect, useState } from 'react';
import { getSettings } from '@/lib/api';

let cached: string | null = null;
let pending: Promise<string> | null = null;

function loadCurrency(): Promise<string> {
    if (cached) return Promise.resolve(cached);
    if (!pending) {
        pending = getSettings()
            .then((s) => (cached = s.currency || 'FCFA'))
            .catch(() => (cached = 'FCFA'));
    }
    return pending;
}

export function useCurrency() {
    const [currency, setCurrency] = useState(cached ?? 'FCFA');

    useEffect(() => {
        loadCurrency().then(setCurrency);
    }, []);

    const formatPrice = (amount: number | string | null | undefined) =>
        `${Number(amount ?? 0).toLocaleString('fr-FR', {
            maximumFractionDigits: 0,
        })} ${currency}`;

    return { currency, formatPrice };
}