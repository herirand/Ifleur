// NOUVEAU : Module coordonnées de facturation et récapitulatif

import { $, $$ } from './utils.js';
import { refreshRecap } from './pricing.js';
import type { BillingSelection } from './types.js';

// NOUVEAU : Récupérer les champs de facturation
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

// NOUVEAU : Vérifier les champs obligatoires de la facturation
// Retourne un tableau de messages d'erreur (vide si tout est OK)
export function validateBilling(): string[] {
  const b = getBilling();
  const errors: string[] = [];

  if (!b.nom) errors.push('Nom');
  if (!b.tel) errors.push('Téléphone');
  if (!b.email || !b.email.includes('@')) errors.push('Email valide');
  if (!b.adresse) errors.push('Adresse de facturation');
  if (!b.ville) errors.push('Ville');

  return errors;
}

// NOUVEAU : Mettre à jour le récapitulatif prix/frais (délégué à pricing)
function syncRecap(): void {
  refreshRecap();
}

// NOUVEAU : Initialiser les event listeners facturation + récap
export function initBilling(): void {
  // NOUVEAU : chaque saisie met à jour le récap total
  const ids = ['billing-name', 'billing-phone', 'billing-email', 'billing-address', 'billing-city'];
  ids.forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.addEventListener('input', syncRecap);
  });

  // NOUVEAU : synchroniser le récap au chargement
  syncRecap();
}
