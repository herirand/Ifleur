// MODIFIÉ : Module paiement et WhatsApp (message enrichi type saison + validation)

import { $, $$, formatPrice } from './utils.js';
import { getPricingState, getDeliveryFee } from './pricing.js';
import { getSelectedColor } from './selectors.js';
import { getDeliveryMode, getSelectedQuartier } from './delivery.js';
import { getBilling, validateBilling } from './billing.js';
import { CONFIG, findZoneForQuartier } from './data.js';

// NOUVEAU : Toggle d'une boîte d'information de paiement
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

// NOUVEAU : Construire le message WhatsApp complet de la commande
function buildWhatsAppMessage(): string {
  const deliveryMode = getDeliveryMode();
  const quartier = getSelectedQuartier();
  const area = findZoneForQuartier(quartier);

  const val = (id: string): string =>
    (document.getElementById(id) as HTMLInputElement)?.value?.trim() || '—';

  const size = document.querySelector('#size-row .c-btn.selected')?.textContent?.trim() || '—';
  const color = getSelectedColor();
  const vase = document.querySelector('#vase-row .c-btn.selected')?.textContent?.trim() || '—';
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
    '*NOUVELLE COMMANDE i.fleur*',
    '',
    '*Produit*',
    `Taille: ${size === '0' ? 'Sur devis / Abo.' : size}`,
    `Couleur: ${color}`,
    `Vase: ${vase === 'oui' ? 'oui (+' + formatPrice(CONFIG.vasePrice) + ')' : 'non'}`,
    `Message: ${message}`,
    '',
    '*Livraison*',
  ];

  if (deliveryMode === 'pickup') {
    lines.push('Mode: Retrait en boutique (gratuit)');
    lines.push(`Date retrait: ${pickupDate || '—'}`);
  } else {
    lines.push('Mode: Livraison à domicile');
    lines.push(`Date livraison: ${deliveryDate || '—'}`);
    lines.push(`Destinataire: ${deliverTo.nom}`);
    lines.push(`Tél destinataire: ${deliverTo.tel}`);
    lines.push(`Adresse: ${deliverTo.adresse}${deliverTo.complement !== '—' ? ' (' + deliverTo.complement + ')' : ''}`);
    lines.push(`Ville: ${deliverTo.ville}`);
    lines.push(`Quartier: ${quartier || '—'}`);
    const feeLabel =
      fees === 0 && area && area.fee === null
        ? 'sur devis'
        : formatPrice(fees);
    lines.push(`Frais livraison: ${feeLabel}`);
  }

  const billingShort = [
    billing.nom || '—',
    billing.tel || '—',
    billing.email || '—',
  ].filter(v => v !== '—').join(' · ');

  lines.push('');
  lines.push('*Facturation*');
  lines.push(`Coordonnées: ${billingShort || '— — — '}`);

  lines.push('');
  lines.push(`*TOTAL: ${isDevis ? 'sur devis' : formatPrice(basePrice + vasePrice + fees)}*`);

  return lines.join('\n');
}

// MODIFIÉ : Ouvrir WhatsApp avec le message pré-rempli (après validation facturation)
export function openWhatsApp(e: Event): void {
  e.preventDefault();

  // NOUVEAU : validation des coordonnées de facturation avant envoi
  const errors = validateBilling();
  if (errors.length > 0) {
    const box = $('#billing-block');
    if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    let msg = 'Merci de compléter les champs de facturation suivants :';
    errors.forEach(er => (msg += `\n• ${er}`));
    alert(msg);
    return;
  }

  const text = buildWhatsAppMessage();
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// MODIFIÉ : Initialiser les event listeners paiement
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
}
