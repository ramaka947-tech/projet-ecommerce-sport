export type Settings = Record<string, string>;

// Tout vient des réglages admin (mêmes clés que le footer).
// Le 2e paramètre est ignoré : il est gardé pour rester compatible avec LegalPage.
export function getCompany(s: Settings = {}, _origin?: string) {
  const email = s.contact_email || '';
  const phone = s.contact_phone || '';
  return {
    name: s.shop_name || 'AD Sport Solutions',
    email,
    phone,
    addressLine: s.contact_address ? `, ${s.contact_address}` : '',
    contact: [email, phone].filter(Boolean).join(' – ') || 'la page Contact du site',
    lastUpdate: '31 octobre 2026',
  };
}

export type Company = ReturnType<typeof getCompany>;