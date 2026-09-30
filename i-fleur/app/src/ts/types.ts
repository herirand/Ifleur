// OrderSize + 'custom', nouveaux types Config/QuoteResult (réponse backend)
export type OrderSize = 'mini' | 'S' | 'M' | 'L' | 'custom';

export type OrderDelivery = 'pickup' | 'home';

// : source unique des couleurs — remplace les 3 listes littérales
// dupliquées (selectors.ts, pricing.ts, order.dto.ts côté serveur).
export const ORDER_COLORS = ['pastel', 'chaud', 'surprenez-moi', 'neutre'] as const;
export type OrderColor = typeof ORDER_COLORS[number];

export interface DeliveryZone {
  name: string;
  fee: number | null;
  quartiers: string[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Config {
  prices: { mini: number; S: number; M: number; L: number };
  vasePrice: number;
  surMesureMin: number;
  whatsappNumber: string;
  shop: {
    name: string;
    address: string;
    hours: string;
    instagram: string;
    facebook: string;
  };
  delivery: {
    retraitGratuit: boolean;
    zones: DeliveryZone[];
  };
  faq: FaqItem[];
}

export interface BillingSelection {
  nom: string;
  tel: string;
  email: string;
  adresse: string;
  ville: string;
}

// : résultat du calcul de prix backend
export interface QuoteResult {
  basePrice: number;
  vasePrice: number;
  deliveryFee: number;
  total: number | null;
  isDevis: boolean;
  deliveryIsDevis: boolean;
}
