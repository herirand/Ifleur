import { refreshRecap } from './pricing.js';
import type { BillingSelection } from './types.js';

// Récupérer les champs de facturation
export function getBilling(): BillingSelection {
  const val = (id: string): string =>
    (document.getElementById(id) as HTMLInputElement)?.value?.trim() || '';

  return {
    nom: val('billing-name'),
    tel: val('billing-phone'),
    email: val('billing-email'),
    adresse: val('billing-address'),
    ville: val('billing-city'),
  };
}

// Mettre à jour le récapitulatif prix/frais (délégué à pricing)
function syncRecap(): void {
  refreshRecap();
}

// Initialiser les event listeners facturation + récap
export function initBilling(): void {
  const ids = ['billing-name', 'billing-phone', 'billing-email', 'billing-address', 'billing-city'];
  ids.forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.addEventListener('input', syncRecap);
  });

  // synchroniser le récap au chargement
  syncRecap();
}
