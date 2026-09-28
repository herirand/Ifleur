// bouton « Paiement » → redirection vers /paiement.html.
// La commande (POST /api/order) ne part PLUS ici : elle part au clic « Payer » sur la page paiement.
// Le calcul du prix reste 100% backend (quote débouncée dans pricing.ts).

import { $ } from './utils.js';
import { getConfig } from './data.js';
import { getSelection, getQuoteResult } from './pricing.js';
import { getDeliveryMode, getSelectedQuartier } from './delivery.js';
import { getBilling } from './billing.js';
import { getSelectedColor } from './selectors.js';
import type { OrderDelivery, OrderSize } from './types.js';

// : clé du stockage de la commande en attente (partagée avec la page paiement)
export const STORAGE_KEY = 'ifleur_order';

const val = (id: string): string =>
  (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement)?.value?.trim() || '';

// Construire le payload transmis à la page paiement (le paymentMethod y sera ajouté au clic « Payer »)
function buildOrderPayload() {
  const sel = getSelection();
  const mode: OrderDelivery = getDeliveryMode();
  const quartier = getSelectedQuartier();

  const payload: Record<string, unknown> = {
    size: sel.size as OrderSize,
    vase: sel.vase,
    color: getSelectedColor(),
    message: val('message') || '',
    deliveryMode: mode,
    billing: getBilling(),
  };

  if (mode === 'pickup') {
    payload.pickupDate = val('pickup-date') || '';
  } else {
    payload.quartier = quartier || '';
    payload.deliveryDate = val('delivery-date') || '';
    payload.recipient = {
      nom: val('deliver-nom'),
      tel: val('deliver-tel'),
      adresse: val('deliver-address'),
      complement: val('deliver-complement'),
      ville: val('deliver-city'),
    };
  }

  return payload;
}

// Valider les champs visibles, marquer les vides en rouge, retourner le premier invalide
function validateAllFields(): HTMLElement | null {
  const fields: { id: string; validate: (v: string) => boolean }[] = [
    { id: 'billing-name', validate: v => v.length > 0 },
    { id: 'billing-phone', validate: v => v.length > 0 },
    { id: 'billing-email', validate: v => v.length > 0 && v.includes('@') },
  ];

  if (getDeliveryMode() === 'pickup') {
    fields.push({ id: 'pickup-date', validate: v => v.length > 0 });
  } else {
    fields.push(
      { id: 'delivery-date', validate: v => v.length > 0 },
      { id: 'deliver-nom', validate: v => v.length > 0 },
      { id: 'deliver-tel', validate: v => v.length > 0 },
      { id: 'deliver-address', validate: v => v.length > 0 },
      { id: 'deliver-city', validate: v => v.length > 0 },
    );
  }

  let firstInvalid: HTMLElement | null = null;
  fields.forEach(({ id, validate }) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (!el) return;
    const v = el.value?.trim() || '';
    if (!validate(v)) {
      el.classList.add('field-error');
      if (!firstInvalid) firstInvalid = el;
    } else {
      el.classList.remove('field-error');
    }
  });

  return firstInvalid;
}

function clearFieldError(id: string): void {
  const el = document.getElementById(id);
  if (el) el.classList.remove('field-error');
}

// : valider, stocker la commande en attente (sélection + quote backend) puis rediriger
function goToCheckout(e: Event): void {
  e.preventDefault();

  const firstInvalid = validateAllFields();
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const payload = buildOrderPayload();
  const quote = getQuoteResult();

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ payload, quote }));
  } catch (err) {
    console.error('sessionStorage indisponible — commande non conservée', err);
  }

  window.location.href = '/paiement.html';
}

// WhatsApp = contact seulement
function openWhatsAppContact(e: Event): void {
  e.preventDefault();
  const CONFIG = getConfig();
  const text = encodeURIComponent('Bonjour i.fleur, j\'aimerais des informations sur vos bouquets. / Hello i.fleur, I would like information about your bouquets.');
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${text}`, '_blank');
}

// Initialiser les event listeners paiement (home)
export function initPayment(): void {
  // CTA → page paiement
  const checkoutBtn = $('#btn-checkout');
  if (checkoutBtn) checkoutBtn.addEventListener('click', goToCheckout);

  // WhatsApp → contact seulement
  const waBtn = $('#btn-whatsapp');
  if (waBtn) waBtn.addEventListener('click', openWhatsAppContact);

  // Supprimer la bordure rouge dès que l'utilisateur corrige un champ
  // : 'quartier-select' retiré — il n'est jamais validé par validateAllFields(),
  // donc la classe 'field-error' ne pouvait jamais y être posée (2 listeners morts).
  const allRequiredIds = [
    'billing-name', 'billing-phone', 'billing-email',
    'pickup-date', 'delivery-date',
    'deliver-nom', 'deliver-tel', 'deliver-address', 'deliver-city',
  ];
  allRequiredIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => clearFieldError(id));
      el.addEventListener('change', () => clearFieldError(id));
    }
  });
}
