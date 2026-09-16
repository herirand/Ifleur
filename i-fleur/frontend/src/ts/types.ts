// Types alignés sur la nouvelle config statique (remplace l'ancien schéma API config)

// Types de taille de commande (ajout mini + sur-mesure, conformité cahier des charges)
export type OrderSize = 'mini' | 'S' | 'M' | 'L' | 'sur-mesure';

// Types de couleur florale (conformité cahier des charges : pastel / chaud / surprenez-moi / neutre)
export type OrderColor = 'pastel' | 'chaud' | 'surprenez-moi' | 'neutre';

// Types de livraison
export type OrderDelivery = 'pickup' | 'home';

// Interface zone de livraison (un groupe de quartiers + frais)
export interface DeliveryZone {
  name: string;
  fee: number | null; // null = frais sur devis
  quartiers: string[];
}

// Interface FAQ
export interface FaqItem {
  q: string;
  a: string;
}

// Interface configuration boutique (chargée depuis config.json)
// ajout des clés mini/surMesureMin pour les nouvelles tailles
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

// État de livraison sélectionné par l'utilisateur
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

// État de facturation sélectionné par l'utilisateur
export interface BillingSelection {
  nom: string;
  tel: string;
  email: string;
  adresse: string;
  ville: string;
}
