// MODIFIÉ : OrderSize + 'custom', nouveaux types Config/QuoteResult (réponse backend)
export type OrderSize = 'mini' | 'S' | 'M' | 'L' | 'custom';

export type OrderColor = 'pastel' | 'chaud' | 'surprenez-moi' | 'neutre';

export type OrderDelivery = 'pickup' | 'home';

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

export interface DeliverySelection {
  mode: OrderDelivery;
  date: string;
  quartier: string;
}

export interface BillingSelection {
  nom: string;
  tel: string;
  email: string;
  adresse: string;
  ville: string;
}

// NOUVEAU : résultat du calcul de prix backend
export interface QuoteResult {
  basePrice: number;
  vasePrice: number;
  deliveryFee: number;
  total: number | null;
  isDevis: boolean;
  deliveryIsDevis: boolean;
}