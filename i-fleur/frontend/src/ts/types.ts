// MODIFIÉ : Types alignés sur la nouvelle config statique (remplace l'ancien schéma API config)

// NOUVEAU : Types de taille de commande
export type OrderSize = 'S' | 'M' | 'L' | 'devis';

// NOUVEAU : Types de couleur florale
export type OrderColor = 'neutre' | 'froid' | 'chaud' | 'nuance';

// NOUVEAU : Types de livraison
export type OrderDelivery = 'pickup' | 'home';

// NOUVEAU : Interface zone de livraison (un groupe de quartiers + frais)
export interface DeliveryZone {
  name: string;
  fee: number | null; // null = frais sur devis
  quartiers: string[];
}

// NOUVEAU : Interface FAQ
export interface FaqItem {
  q: string;
  a: string;
}

// NOUVEAU : Interface configuration boutique (chargée depuis config.json)
export interface Config {
  prices: { S: number; M: number; L: number };
  vasePrice: number;
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

// NOUVEAU : État de livraison sélectionné par l'utilisateur
export interface DeliverySelection {
  mode: OrderDelivery;
  date: string;
  nom: string;
  tel: string;
  adresse: string;
  complement: string;
  ville: string;
  quartier: string;
  zone: DeliveryZone | null;
}

// NOUVEAU : État de facturation sélectionné par l'utilisateur
export interface BillingSelection {
  nom: string;
  tel: string;
  email: string;
  adresse: string;
  ville: string;
}
