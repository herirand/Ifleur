// Module paiement et WhatsApp (message enrichi type saison + validation)

import { $, $$, formatPrice } from './utils.js';
import { getPricingState, getDeliveryFee } from './pricing.js';
import { getSelectedColor } from './selectors.js';
import { getDeliveryMode, getSelectedQuartier } from './delivery.js';
import { getBilling } from './billing.js';
import { CONFIG, findZoneForQuartier } from './data.js';

// Toggle d'une boîte d'information de paiement
export function toggleBox(id: string, others: string[]): void {
  others.forEach(o => {
    const el = document.getElementById(o);
    if (el) el.style.display = 'none';
  });

  const box = document.getElementById(id);
  if (!box) return;

  box.style.display = box.style.display === 'none' ? 'block' : 'none';

  if (box.style.display === 'block') {
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Construire le message WhatsApp complet de la commande
function buildWhatsAppMessage(): string {
  const deliveryMode = getDeliveryMode();
  const quartier = getSelectedQuartier();
  const area = findZoneForQuartier(quartier);

  const val = (id: string): string =>
    (document.getElementById(id) as HTMLInputElement)?.value?.trim() || '—';

  const sizeBtn = document.querySelector('#size-row .c-btn.selected') as HTMLElement | null;
  const isDevisSize = sizeBtn?.dataset.price === '0';
  const size = isDevisSize
    ? 'Sur-mesure / custom'
    : (sizeBtn?.textContent?.trim().split('\n')[0] || '—');
  const color = getSelectedColor();
  // vase en radio-boîtes (sélecteur .r-btn)
  const vaseBtn = document.querySelector('#vase-row .r-btn.selected') as HTMLElement | null;
  const withVase = vaseBtn ? (parseInt(vaseBtn.dataset.price || '0', 10) || 0) > 0 : false;
  const message = (document.getElementById('message') as HTMLTextAreaElement)?.value?.trim() || '—';

  const pickupDate = val('pickup-date');
  const deliveryDate = val('delivery-date');
  const deliverTo = {
    nom: val('deliver-nom') || '—',
    tel: val('deliver-tel') || '—',
    adresse: val('deliver-address') || '—',
    complement: val('deliver-complement') || '—',
    ville: val('deliver-city') || '—',
  };

  const billing = getBilling();
  const { isDevis, basePrice, vasePrice } = getPricingState();
  const fees = getDeliveryFee();

  const lines = [
    '*NOUVELLE COMMANDE i.fleur / NEW ORDER*',
    '',
    '*Produit / Product*',
    `Taille / Size: ${isDevisSize ? 'Sur-mesure / custom (min ' + formatPrice(CONFIG.surMesureMin) + ')' : size}`,
    `Couleur / Color: ${color}`,
    `Vase / Pot: ${withVase ? 'oui / yes (+' + formatPrice(CONFIG.vasePrice) + ')' : 'non / no'}`,
    `Message: ${message}`,
    '',
    '*Livraison / Delivery*',
  ];

  if (deliveryMode === 'pickup') {
    lines.push('Mode: Retrait en boutique (gratuit) / Pick up in store (free)');
    lines.push(`Date retrait / Pickup on: ${pickupDate || '—'}`);
  } else {
    lines.push('Mode: Livraison à domicile / Home delivery');
    lines.push(`Date livraison / Delivery on: ${deliveryDate || '—'}`);
    lines.push(`Destinataire / Recipient: ${deliverTo.nom}`);
    lines.push(`Tél destinataire / Phone: ${deliverTo.tel}`);
    lines.push(`Adresse / Address: ${deliverTo.adresse}${deliverTo.complement !== '—' ? ' (' + deliverTo.complement + ')' : ''}`);
    lines.push(`Ville / City: ${deliverTo.ville}`);
    lines.push(`Quartier / District: ${quartier || '—'}`);
    const feeLabel =
      fees === 0 && area && area.fee === null
        ? 'sur devis / on quote'
        : formatPrice(fees);
    lines.push(`Frais livraison / Delivery fee: ${feeLabel}`);
  }

  const billingShort = [
    billing.nom || '—',
    billing.tel || '—',
    billing.email || '—',
  ].filter(v => v !== '—').join(' · ');

  lines.push('');
  lines.push('*Facturation / Billing*');
  lines.push(`Coordonnées / Infos: ${billingShort || '— — — '}`);

  lines.push('');
  lines.push(`*TOTAL: ${isDevis ? 'sur devis / on quote' : formatPrice(basePrice + vasePrice + fees)}*`);

  return lines.join('\n');
}

// Validation globale — liste des champs obligatoires visibles
function getVisibleRequiredFields(): { id: string; validate: (v: string) => boolean }[] {
  const fields: { id: string; validate: (v: string) => boolean }[] = [
    { id: 'billing-name', validate: v => v.length > 0 },
    { id: 'billing-phone', validate: v => v.length > 0 },
    { id: 'billing-email', validate: v => v.length > 0 && v.includes('@') },
  ];

  const deliveryMode = getDeliveryMode();
  if (deliveryMode === 'pickup') {
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

  return fields;
}

// Valider tous les champs visibles, marquer les vides en rouge, retourner le premier invalide
function validateAllFields(): HTMLElement | null {
  const fields = getVisibleRequiredFields();
  let firstInvalid: HTMLElement | null = null;

  fields.forEach(({ id, validate }) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (!el) return;
    const val = el.value?.trim() || '';
    if (!validate(val)) {
      el.classList.add('field-error');
      if (!firstInvalid) firstInvalid = el;
    } else {
      el.classList.remove('field-error');
    }
  });

  return firstInvalid;
}

// Supprimer la classe d'erreur quand l'utilisateur corrige un champ
function clearFieldError(id: string): void {
  const el = document.getElementById(id);
  if (el) el.classList.remove('field-error');
}

// Ouvrir WhatsApp avec le message pré-rempli (après validation globale)
export function openWhatsApp(e: Event): void {
  e.preventDefault();

  // Valider tous les champs visibles, marquer les vides en rouge + scroll au premier (pas de focus : évite d'ouvrir le pikcer date)
  const firstInvalid = validateAllFields();
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const text = buildWhatsAppMessage();
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// Initialiser les event listeners paiement
export function initPayment(): void {
  const whatsappBtn = document.querySelector('.pay-btn.wa');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', openWhatsApp);
  }

  const mvolaBtn = $$('.pay-btn')[1];
  if (mvolaBtn) {
    mvolaBtn.addEventListener('click', () => toggleBox('mm-box', ['especes-box', 'sendwave-box']));
  }

  const especesBtn = $$('.pay-btn')[2];
  if (especesBtn) {
    especesBtn.addEventListener('click', () => toggleBox('especes-box', ['mm-box', 'sendwave-box']));
  }

  const sendwaveBtn = $$('.pay-btn')[3];
  if (sendwaveBtn) {
    sendwaveBtn.addEventListener('click', () => toggleBox('sendwave-box', ['mm-box', 'especes-box']));
  }

  document.querySelectorAll('.mm-box .pay-btn, .especes-box .pay-btn, .sendwave-box .pay-btn').forEach(btn => {
    btn.addEventListener('click', openWhatsApp);
  });

  // Supprimer la bordure rouge dès que l'utilisateur corrige un champ
  const allRequiredIds = [
    'billing-name', 'billing-phone', 'billing-email',
    'pickup-date', 'delivery-date',
    'deliver-nom', 'deliver-tel', 'deliver-address', 'deliver-city', 'quartier-select',
  ];
  allRequiredIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => clearFieldError(id));
      el.addEventListener('change', () => clearFieldError(id));
    }
  });
}
