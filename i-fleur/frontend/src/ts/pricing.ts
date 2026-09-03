// MODIFIÉ : Module calcul des prix et gestion des tailles/vases (+ frais de livraison)

import { $, $$, formatPrice } from './utils.js';
import { CONFIG } from './data.js';

// NOUVEAU : État du pricing
let basePrice = CONFIG.prices.S;
let vasePrice = 0;
let isDevis = false;
let deliveryFee = 0; // NOUVEAU : frais de la zone sélectionnée (0 si retrait)

// NOUVEAU : Fonction d'abonnement pour notifier les changements de total
// (utilisée par delivery.ts pour recalculer quand le quartier change)
type TotalListener = (total: number, isDevis: boolean) => void;
let listeners: TotalListener[] = [];

export function onTotalChange(fn: TotalListener): void {
  listeners.push(fn);
}

// NOUVEAU : Mettre à jour les frais de livraison (appelé par delivery.ts)
export function setDeliveryFee(fee: number): void {
  deliveryFee = fee;
  updateTotal();
  notify();
}

// NOUVEAU : Mettre à jour le mode livraison (retrait = 0 frais)
export function setDeliveryHome(home: boolean): void {
  if (!home) {
    deliveryFee = 0;
    updateTotal();
    notify();
  }
}

// NOUVEAU : Calculer le total courant
export function getTotal(): number {
  return basePrice + vasePrice + deliveryFee;
}

// NOUVEAU : Récupérer les frais de livraison courant
export function getDeliveryFee(): number {
  return deliveryFee;
}

// NOUVEAU : Mettre à jour l'affichage du total
export function updateTotal(): void {
  const display = $('#total-display');
  if (display) {
    display.textContent = isDevis ? 'sur devis' : formatPrice(getTotal());
  }
}

// MODIFIÉ : Gestion de la sélection de taille
export function selectSize(btn: HTMLElement): void {
  const buttons = $$('#size-row .c-btn');
  buttons.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  const priceAttr = btn.dataset.price;

  if (priceAttr === '0' || priceAttr === undefined) {
    isDevis = true;
  } else {
    isDevis = false;
    basePrice = parseInt(priceAttr, 10);
  }

  updateTotal();
  notify();
}

// MODIFIÉ : Gestion de la sélection de vase
export function selectVase(btn: HTMLElement): void {
  const buttons = $$('#vase-row .c-btn');
  buttons.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  vasePrice = parseInt(btn.dataset.price || '0', 10) || 0;
  updateTotal();
  notify();
}

// NOUVEAU : Récupérer l'état courant du pricing
export function getPricingState() {
  return { basePrice, vasePrice, isDevis, deliveryFee, total: getTotal() };
}

// NOUVEAU : Notifier les écouteurs
function notify(): void {
  listeners.forEach(fn => fn(getTotal(), isDevis));
}

// MODIFIÉ : Initialiser les event listeners pricing + écouteur récap
export function initPricing(): void {
  $$('#size-row .c-btn').forEach(btn => {
    btn.addEventListener('click', () => selectSize(btn));
  });

  $$('#vase-row .c-btn').forEach(btn => {
    btn.addEventListener('click', () => selectVase(btn));
  });

  // NOUVEAU : synchroniser les lignes du récap quand le total change
  onTotalChange(() => {
    const recap = $('#recap');
    if (recap) refreshRecap();
  });

  updateTotal();
  refreshRecap();
}

// NOUVEAU : Remplir le récapitulatif (appelé aussi depuis billing.ts)
export function refreshRecap(): void {
  const setText = (id: string, value: string): void => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const size = document.querySelector('#size-row .c-btn.selected')?.textContent?.trim() || '—';
  const color = document.querySelector('#color-row .col-btn.selected')?.closest('.col-opt')?.className?.split(' ')[0] || '—';
  const vase = document.querySelector('#vase-row .c-btn.selected')?.textContent?.trim() || '—';
  const message = (document.getElementById('message') as HTMLTextAreaElement)?.value?.trim() || '—';

  setText('recap-size', size === '0' ? 'Sur devis / Abo.' : `Taille ${size}`);
  setText('recap-color', color.charAt(0).toUpperCase() + color.slice(1));
  setText('recap-vase', vase === 'oui' ? `Oui (+${formatPrice(CONFIG.vasePrice)})` : 'Non');
  setText('recap-message', message);

  const st = getPricingState();
  setText('recap-prix', st.isDevis ? 'Sur devis' : formatPrice(st.basePrice));
  setText('recap-frais', st.deliveryFee === 0 ? 'Gratuit' : formatPrice(st.deliveryFee));
}
