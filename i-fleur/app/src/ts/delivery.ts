// le module envoie mode + quartier au backend (quote) et affiche les frais serveur.
// Aucun calcul local des frais de livraison.

import { $, $$, formatPrice } from './utils.js';
import { getAllQuartiers, getConfig } from './data.js';
import { setSelection, getQuoteResult, onQuoteChange } from './pricing.js';
import type { OrderDelivery } from './types.js';

let deliveryMode: OrderDelivery = 'pickup';
let selectedQuartier = '';

const FRAIS_EL = 'delivery-fee-info';

export function setDelivery(mode: OrderDelivery, btn: HTMLElement): void {
  deliveryMode = mode;

  const buttons = $$('.d-opt');
  buttons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const pickupBlock = $('#pickup-block') as HTMLElement | null;
  const homeBlock = $('#home-block') as HTMLElement | null;

  if (pickupBlock) pickupBlock.style.display = mode === 'pickup' ? 'block' : 'none';
  if (homeBlock) homeBlock.style.display = mode === 'home' ? 'block' : 'none';

  if (mode === 'pickup') {
    selectedQuartier = '';
    setSelection({ deliveryMode: mode, quartier: '' });
  } else {
    setSelection({ deliveryMode: mode, quartier: selectedQuartier });
  }
  updateFeeInfo();
}

function onQuartierChange(e: Event): void {
  const select = e.target as HTMLSelectElement;
  selectedQuartier = select.value;
  setSelection({ quartier: select.value });
  updateFeeInfo();
}

// affiche les frais calculés par le backend
export function updateFeeInfo(): void {
  const el = document.getElementById(FRAIS_EL);
  if (!el) return;

  if (deliveryMode === 'pickup') {
    // : le message vient de la config (delivery.retraitGratuit) au lieu d'un
    // « gratuit » en dur — la config redevient la source de vérité du texte.
    el.textContent = getConfig().delivery.retraitGratuit
      ? 'Retrait en boutique : gratuit / pick up in store: free'
      : 'Retrait en boutique : voir en boutique / pick up in store: see in store';
    return;
  }

  const q = getQuoteResult();
  if (!selectedQuartier) {
    el.textContent = 'Sélectionnez votre quartier pour calculer les frais. / Select your district to calculate the fees.';
  } else if (q.deliveryIsDevis) {
    el.textContent = `${selectedQuartier} — frais sur devis (nous vous contacterons). / fee on quote (we will contact you).`;
  } else {
    const fee = q.deliveryFee === 0 ? 'gratuit / free' : formatPrice(q.deliveryFee);
    el.textContent = `${selectedQuartier} — frais de livraison : ${fee}.`;
  }
}

function populateQuartiers(): void {
  const select = $('#quartier-select') as HTMLSelectElement | null;
  if (!select) return;

  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '— choisir un quartier / choose a district —';
  select.appendChild(placeholder);

  // : regroupement par zone en UN seul passage (Map). L'ancienne version
  // re-filtrait toute la liste à chaque zone => O(n²) sur ~50 quartiers (~2 500 itérations).
  // Ici : 1 parcours pour construire, 1 pour rendre => O(n).
  // Aucun calcul de prix : `fee` vient de la config, il est juste affiché.
  const byZone = new Map<string, { fee: number | null; quartiers: string[] }>();
  for (const { quartier, zone } of getAllQuartiers()) {
    let entry = byZone.get(zone.name);
    if (!entry) {
      entry = { fee: zone.fee, quartiers: [] };
      byZone.set(zone.name, entry);
    }
    entry.quartiers.push(quartier);
  }

  for (const [name, { fee, quartiers }] of byZone) {
    const group = document.createElement('optgroup');
    const feeTxt = fee === null ? 'sur devis' : fee === 0 ? 'gratuit' : formatPrice(fee);
    group.label = `${name} (${feeTxt})`;
    for (const q of quartiers) {
      const opt = document.createElement('option');
      opt.value = q;
      opt.textContent = q;
      group.appendChild(opt);
    }
    select.appendChild(group);
  }
}

export function getDeliveryMode(): OrderDelivery {
  return deliveryMode;
}

export function getSelectedQuartier(): string {
  return selectedQuartier;
}

// : restauration — applique un quartier (contenu du select) et relance le quote
export function setQuartier(quartier: string): void {
  const select = $('#quartier-select') as HTMLSelectElement | null;
  if (select) select.value = quartier;
  selectedQuartier = quartier;
  setSelection({ quartier });
  updateFeeInfo();
}

export function initDelivery(): void {
  $$('.d-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.textContent?.toLowerCase().includes('retrait') ? 'pickup' : 'home';
      setDelivery(mode, btn);
    });
  });

  const quartierSelect = $('#quartier-select') as HTMLSelectElement | null;
  if (quartierSelect) quartierSelect.addEventListener('change', onQuartierChange);

  populateQuartiers();
  updateFeeInfo();
  onQuoteChange(() => updateFeeInfo());
}
