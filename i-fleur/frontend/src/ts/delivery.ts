// MODIFIÉ : Module mode de livraison + sélecteur de quartier + frais dynamiques

import { $, $$ } from './utils.js';
import { getAllQuartiers, findZoneForQuartier, CONFIG } from './data.js';
import { setDeliveryFee, setDeliveryHome, onTotalChange } from './pricing.js';
import type { DeliveryZone, OrderDelivery } from './types.js';

// NOUVEAU : Mode de livraison courant
let deliveryMode: OrderDelivery = 'pickup';

// NOUVEAU : Quartier sélectionné (pour livraison à domicile)
let selectedQuartier = '';

// NOUVEAU : Détail de frais affiché sous le sélecteur de quartier
const FRAIS_EL = 'delivery-fee-info';

// MODIFIÉ : Basculer entre retrait et livraison à domicile
export function setDelivery(mode: OrderDelivery, btn: HTMLElement): void {
  deliveryMode = mode;

  const buttons = $$('.d-opt');
  buttons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const pickupBlock = $('#pickup-block') as HTMLElement | null;
  const homeBlock = $('#home-block') as HTMLElement | null;

  if (pickupBlock) {
    pickupBlock.style.display = mode === 'pickup' ? 'block' : 'none';
  }
  if (homeBlock) {
    homeBlock.style.display = mode === 'home' ? 'block' : 'none';
  }

  // NOUVEAU : retrait = gratuit, livraison = frais selon quartier
  if (mode === 'pickup') {
    setDeliveryHome(false);
    setDeliveryFee(0);
    updateFeeInfo();
  } else {
    setDeliveryHome(true);
    applyQuartierFee(selectedQuartier);
  }
}

// NOUVEAU : Appliquer les frais selon le quartier choisi
function applyQuartierFee(quartier: string): void {
  const zone = findZoneForQuartier(quartier);
  if (zone && zone.fee !== null) {
    setDeliveryFee(zone.fee);
  } else if (zone && zone.fee === null) {
    // NOUVEAU : hors zone => montant sur devis (frappe un montant symbolique pour le calcul)
    setDeliveryFee(0);
  } else {
    setDeliveryFee(0);
  }
  selectedQuartier = quartier;
  updateFeeInfo();
}

// NOUVEAU : Afficher le détail des frais de livraison + libellé quartier
export function updateFeeInfo(): void {
  const el = document.getElementById(FRAIS_EL);
  if (!el) return;

  if (deliveryMode === 'pickup') {
    el.textContent = 'Retrait en boutique : gratuit';
    return;
  }

  const zone = findZoneForQuartier(selectedQuartier);
  if (!selectedQuartier) {
    el.textContent = 'Sélectionnez votre quartier pour calculer les frais.';
  } else if (zone && zone.fee === null) {
    el.textContent = `${selectedQuartier} — frais sur devis (nous vous contactons).`;
  } else if (zone) {
    el.textContent = `${selectedQuartier} — frais de livraison : ${formatFees(zone.fee)}.`;
  } else {
    el.textContent = 'Quartier non reconnu — frais sur devis.';
  }
}

// NOUVEAU : Formater les frais (0 => Gratuit)
function formatFees(fee: number | null): string {
  if (fee === null) return 'sur devis';
  if (fee === 0) return 'gratuit';
  return fee.toLocaleString('fr-FR') + ' Ar';
}

// NOUVEAU : Construire la liste des quartiers dans le <select>
function populateQuartiers(): void {
  const select = $('#quartier-select') as HTMLSelectElement | null;
  if (!select) return;

  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '— choisir un quartier —';
  select.appendChild(placeholder);

  const all = getAllQuartiers();
  // NOUVEAU : regroupe par zone, séparateur de zone en premier
  const seenZone = new Set<string>();
  for (const { quartier, zone } of all) {
    if (!seenZone.has(zone.name)) {
      seenZone.add(zone.name);
      const optgroup = document.createElement('optgroup');
      optgroup.label = zone.name + (zone.fee !== null ? ` (${formatFees(zone.fee)})` : '');
      select.appendChild(optgroup);
      const opt = document.createElement('option');
      opt.value = quartier;
      opt.textContent = quartier;
      optgroup.appendChild(opt);
    } else {
      const groups = select.querySelectorAll('optgroup');
      const lastGroup = groups[groups.length - 1];
      const opt = document.createElement('option');
      opt.value = quartier;
      opt.textContent = quartier;
      lastGroup.appendChild(opt);
    }
  }
}

// NOUVEAU : Récupérer le mode de livraison courant
export function getDeliveryMode(): OrderDelivery {
  return deliveryMode;
}

// NOUVEAU : Récupérer le quartier sélectionné
export function getSelectedQuartier(): string {
  return selectedQuartier;
}

// NOUVEAU : L'utilisateur choisit son quartier
function onQuartierChange(e: Event): void {
  const select = e.target as HTMLSelectElement;
  applyQuartierFee(select.value);
}

// NOUVEAU : Initialiser les event listeners livraison
export function initDelivery(): void {
  $$('.d-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.textContent?.includes('retrait') ? 'pickup' : 'home';
      setDelivery(mode, btn);
    });
  });

  const quartierSelect = $('#quartier-select') as HTMLSelectElement | null;
  if (quartierSelect) {
    quartierSelect.addEventListener('change', onQuartierChange);
  }

  populateQuartiers();
  updateFeeInfo();

  // NOUVEAU : garantir que le total reflète le mode initial
  setDeliveryHome(false);
  setDeliveryFee(0);

  // NOUVEAU : on place le sélecteur de quartier dans le bloc livraison si présent ailleurs
  onTotalChange(() => updateFeeInfo());
}
