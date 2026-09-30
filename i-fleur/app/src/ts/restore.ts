// : restauration de la commande en attente au retour du configurateur
// (bouton « Modifier votre commande » depuis /paiement.html). Lit
// sessionStorage['ifleur_order'] et re-applique la sélection dans le DOM
// (taille, couleur, vase, message, livraison, quartier, facturation), puis
// relance le quote backend via setSelection/setDelivery. Aucun calcul local.

import { $, $$ } from './utils.js';
import { STORAGE_KEY } from './payment.js';
import { setSelection } from './pricing.js';
import { selectColor } from './selectors.js';
import { setDelivery, setQuartier } from './delivery.js';
import type { OrderDelivery, OrderSize } from './types.js';

interface RestoreRecipient {
  nom?: string;
  tel?: string;
  adresse?: string;
  complement?: string;
  ville?: string;
}

interface RestoreBilling {
  nom?: string;
  tel?: string;
  email?: string;
  adresse?: string;
  ville?: string;
}

interface RestorePayload {
  size?: OrderSize;
  vase?: boolean;
  color?: string;
  message?: string;
  deliveryMode?: OrderDelivery;
  quartier?: string;
  pickupDate?: string;
  deliveryDate?: string;
  recipient?: RestoreRecipient | null;
  billing?: RestoreBilling | null;
}

// Remplir un champ DOM s'il existe (garde la valeur si non fournie)
function setField(id: string, value: string | undefined): void {
  if (value === undefined) return;
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (el) el.value = value;
}

// : ré-applique le payload de la commande en attente sur le configurateur
export function restoreSelection(): void {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let pending: { payload?: RestorePayload } | null = null;
  try {
    pending = JSON.parse(raw);
  } catch {
    return;
  }
  const p = pending?.payload;
  if (!p) return;

  // 1. Taille (bouton rond) + bloc sur-mesure
  if (p.size) {
    const btn = $<HTMLElement>(`#size-row .c-btn[data-size="${p.size}"]`);
    if (btn) {
      $$('#size-row .c-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const smBlock = document.getElementById('size-surmesure-block');
      if (smBlock) smBlock.classList.toggle('visible', p.size === 'custom');
      setSelection({ size: p.size });
    }
  }

  // 2. Couleur (classe de palette sur .col-opt)
  if (p.color) {
    const btn = $<HTMLElement>(`#color-row .col-opt.${p.color} .col-btn`);
    if (btn) selectColor(btn);
  }

  // 3. Vase (oui/non)
  if (p.vase !== undefined) {
    const btn = $<HTMLElement>(`#vase-row .r-btn[data-vase="${p.vase ? '1' : '0'}"]`);
    if (btn) {
      $$('#vase-row .r-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      setSelection({ vase: p.vase });
    }
  }

  // 4. Message personnel
  setField('message', p.message);

  // 5. Mode de livraison (pickup / home) — gère l'affichage des blocs
  if (p.deliveryMode) {
    const btn = $<HTMLElement>(`.delivery-toggle .d-opt[data-delivery="${p.deliveryMode}"]`);
    if (btn) setDelivery(p.deliveryMode, btn);
  }

  // 6. Champs conditionnels + quartier
  if (p.deliveryMode === 'home') {
    if (p.quartier) setQuartier(p.quartier);
    setField('delivery-date', p.deliveryDate);
    setField('deliver-nom', p.recipient?.nom);
    setField('deliver-tel', p.recipient?.tel);
    setField('deliver-address', p.recipient?.adresse);
    setField('deliver-complement', p.recipient?.complement);
    setField('deliver-city', p.recipient?.ville);
  } else {
    setField('pickup-date', p.pickupDate);
  }

  // 7. Coordonnées de facturation
  setField('billing-name', p.billing?.nom);
  setField('billing-phone', p.billing?.tel);
  setField('billing-email', p.billing?.email);
  setField('billing-address', p.billing?.adresse);
  setField('billing-city', p.billing?.ville);
}
