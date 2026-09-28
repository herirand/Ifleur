// : page paiement dédiée (/paiement.html) — récap de la commande en attente,
// total REQUOTÉ au backend (temps réel), choix MVola/carte, bouton « Confirmer le paiement » qui envoie
// la commande (POST /api/order). Le processeur de paiement réel sera branché plus tard.
// Aucun calcul de prix local.

import { $, $$, formatPrice, setText } from './utils.js';
import { getConfig } from './data.js';
import type { QuoteResult, OrderSize } from './types.js';
import type { PaymentMethod } from './types-payment.js';
import { STORAGE_KEY } from './payment.js';

// plus exporté — PendingOrder n'est consommé qu'ici
interface PendingOrder {
  payload: Record<string, unknown>;
  quote: QuoteResult;
}

interface RecipientLike { nom?: string; tel?: string; adresse?: string; complement?: string; ville?: string }
interface BillingLike { nom?: string; tel?: string; email?: string }
interface PayloadLike {
  size?: OrderSize;
  vase?: boolean;
  color?: string;
  message?: string;
  deliveryMode?: 'pickup' | 'home';
  quartier?: string;
  pickupDate?: string;
  deliveryDate?: string;
  recipient?: RecipientLike | null;
  billing?: BillingLike | null;
}

let pending: PendingOrder | null = null;
let paymentMethod: PaymentMethod = 'Mvola';
let currentQuote: QuoteResult = {
  basePrice: 0, vasePrice: 0, deliveryFee: 0, total: null, isDevis: false, deliveryIsDevis: false,
};

// : libellé de taille. Volontairement SANS getConfig() : cette fonction est
// appelée sur /paiement.html, chemin où loadConfig() n'est jamais exécuté
// (main.ts retourne avant init()) — getConfig() y lèverait 'Configuration non chargé'.
// L'écart avec le libellé backend (« min … ») est assumé : le récap affiche le type,
// le minimum est communiqué dans l'email de confirmation.
function sizeLabel(size: OrderSize): string {
  const map: Record<OrderSize, string> = {
    mini: 'Mini', S: 'S', M: 'M', L: 'L', custom: 'Sur-mesure / Custom',
  };
  return map[size] ?? '—';
}

// Valider minimum les infos de facturation avant l'envoi (déjà vérifiées sur la home)
function hasValidBilling(): boolean {
  const b = (pending?.payload.billing || {}) as BillingLike;
  return Boolean(b.nom && b.tel && b.email && b.email.includes('@'));
}

// : lien WhatsApp « envoyer la capture de paiement ». Le numéro vient de la
// config (GET /api/config) et le montant du quote serveur — aucune arithmétique locale.
function initWhatsappProof(): void {
  const link = document.querySelector<HTMLAnchorElement>('#co-wa-proof');
  if (!link) return;

  let number = '';
  try {
    number = getConfig().whatsappNumber;
  } catch {
    return; // config non chargée : on laisse le lien tel quel
  }
  if (!number) return;

  // : montant nu (sans préposition) — la préposition est posée dans chaque
  // langue (« de » en FR, « of » en EN) pour éviter qu'une fuite dans l'autre.
  const amount = currentQuote.isDevis ? '' : ` ${formatPrice(currentQuote.total ?? 0)}`;
  const msg = `Bonjour i.fleur, je viens d'envoyer le paiement de${amount}. Voici la capture de mon paiement : / Hello i.fleur, I just sent the payment of${amount}. Here is my payment screenshot:`;
  link.href = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

// Afficher le statut (même style que la home)
function setStatus(msg: string, isError = false): void {
  const el = $('#co-order-status');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('status-error', isError);
  el.classList.toggle('status-ok', !isError);
}

function addRow(grid: HTMLElement, label: string, value: string): void {
  const row = document.createElement('div');
  row.className = 'recap-row';

  const l = document.createElement('span');
  l.className = 'recap-label';
  l.textContent = label;

  const v = document.createElement('span');
  v.className = 'recap-value';
  v.textContent = value;

  row.appendChild(l);
  row.appendChild(v);
  grid.appendChild(row);
}

// Construire le récapitulatif depuis le payload + quote backend
function renderRecap(payload: Record<string, unknown>, quote: QuoteResult): void {
  const grid = $('#co-recap-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const p = payload as PayloadLike;

  addRow(grid, 'Bouquet', sizeLabel(p.size || 'custom'));
  addRow(grid, 'Couleur / Color', p.color || '—');

  if (p.deliveryMode === 'home') {
    addRow(grid, 'Quartier', p.quartier || 'Hors zone / Out of zone');
    addRow(grid, 'Livraison', p.deliveryDate ? `le ${p.deliveryDate} / on ${p.deliveryDate}` : 'date à convenir / date to agree');
    const r: RecipientLike = p.recipient || {};
    const recipientTxt = [r.nom, r.tel, r.adresse, r.ville].filter(Boolean).join(' · ');
    if (recipientTxt) addRow(grid, 'Destinataire', recipientTxt);
  } else {
    addRow(grid, 'Retrait', p.pickupDate ? `le ${p.pickupDate} / on ${p.pickupDate}` : 'date à convenir / date to agree');
  }

  addRow(grid, 'Vase / Pot', p.vase ? `Oui / Yes (+${formatPrice(quote.vasePrice)})` : 'Non / No');

  if (p.message) addRow(grid, 'Message', p.message);

  const b: BillingLike = p.billing || {};
  const billingTxt = [b.nom, b.tel, b.email].filter(Boolean).join(' · ');
  if (billingTxt) addRow(grid, 'Facturation / Billing', billingTxt);

  renderTotal(quote);
}

function renderTotal(quote: QuoteResult): void {
  setText('co-total-display',
    quote.isDevis ? 'sur devis / on quote'
      : (quote.total === null ? '—' : formatPrice(quote.total)));
}

// : re-quoter au backend à l'arrivée sur la page (temps réel, calcul serveur)
async function requote(): Promise<void> {
  if (!pending) return;
  const p = pending.payload as PayloadLike;

  try {
    const res = await fetch('/api/order/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        size: p.size,
        vase: Boolean(p.vase),
        deliveryMode: p.deliveryMode,
        quartier: p.deliveryMode === 'home' ? (p.quartier || '') : undefined,
      }),
    });
    if (!res.ok) throw new Error('quote failed');
    const data = await res.json();
    currentQuote = {
      basePrice: data.basePrice,
      vasePrice: data.vasePrice,
      deliveryFee: data.deliveryFee,
      total: data.total,
      isDevis: data.isDevis,
      deliveryIsDevis: data.deliveryIsDevis,
    };
  } catch (err) {
    console.error(err);
    currentQuote = pending.quote ?? currentQuote;
  }

  renderRecap(pending.payload, currentQuote);
  initWhatsappProof();
  const totalTxt = currentQuote.isDevis ? 'sur devis / on quote' : formatPrice(currentQuote.total ?? 0);
  setStatus(`Total à payer : ${totalTxt} — vérifiez vos informations puis cliquez sur « modifier votre commande » ou « Confirmer le paiement ». / Amount due: ${totalTxt} — review your details then click "Pay".`);
}

// « Confirmer le paiement » → POST /api/order (email client). Point d'intégration du processeur de paiement.
async function onPay(e: Event): Promise<void> {
  e.preventDefault();
  const payBtn = $('#btn-pay') as HTMLButtonElement | null;
  if (!pending || payBtn?.disabled) return;

  if (!hasValidBilling()) {
    setStatus('La commande est incomplète — retournez à la configuration. / The order is incomplete — please go back to the configurator.', true);
    return;
  }

  // Le mode de paiement choisi sur CETTE page est ajouté au payload
  pending.payload.paymentMethod = paymentMethod;

  // en mode carte, validation locale des champs (comportement de l'élément
  // de paiement de la référence) — blocage si invalide. L'API réelle sera branchée ici :
  // TODO API paiement carte (Stripe / partenaire bancaire) — remplacer la validation
  // locale par la création du PaymentIntent (les données de carte ne sont jamais
  // stockées ni envoyées au backend /i.fleur).
  if (paymentMethod === 'carte' && !validateCard()) return;

  if (payBtn) payBtn.disabled = true;
  setStatus('Envoi de la commande… / Sending your order…');

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pending.payload),
    });
    const data = await res.json().catch(() => ({} as { ok?: boolean; message?: string; isDevis?: boolean }));

    if (!res.ok || !data.ok) {
      throw new Error(data.message || 'order failed');
    }

    // : emplacement réservé où le processeur de paiement sera intégré (Stripe / MVola API)
    const placeholder = $('#co-pay-placeholder');
    if (placeholder) {
      const totalTxt = data.isDevis ? 'sur devis / on quote' : formatPrice(currentQuote.total ?? 0);
      const totalEl = placeholder.querySelector('.co-placeholder-total');
      if (totalEl) totalEl.textContent = totalTxt;
      placeholder.classList.add('visible');
      placeholder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    setStatus('Commande bien reçue — un e-mail de confirmation vous a été envoyé. / Order received — a confirmation email has been sent.');

    // La commande est passéée — on vide la file d'attente locale
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
  } catch (err) {
    console.error(err);
    setStatus("Échec de l'envoi. Réessayez ou contactez-nous sur WhatsApp. / Failed to send. Please try again or contact us on WhatsApp.", true);
  } finally {
    if (payBtn) payBtn.disabled = false;
  }
}

// Toggle MVola / carte sur la page paiement
function switchPaymentMethod(method: PaymentMethod): void {
  paymentMethod = method;
  const boxId = method === 'Mvola' ? 'co-mv-box' : 'co-card-box';
  const otherId = method === 'Mvola' ? 'co-card-box' : 'co-mv-box';
  const box = document.getElementById(boxId);
  const other = document.getElementById(otherId);
  if (box) box.style.display = 'block';
  if (other) other.style.display = 'none';
}

// : expiration valide — format MM/AA et non échue
function isExpiryValid(value: string): boolean {
  const m = value.match(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

// : validation locale des champs carte (façon référence saison/Stripe).
// Encadre chaque champ invalide et affiche un message FR ; les données de carte ne
// sont jamais stockées (sessionStorage) ni envoyées au backend. Seront remplacées
// par l'API réelle (voir TODO API paiement carte dans onPay).
function validateCard(): boolean {
  const fields: Array<{ el: HTMLInputElement | null; ok: boolean }> = [
    {
      el: $('#card-name') as HTMLInputElement | null,
      ok: false,
    },
    {
      el: $('#card-number') as HTMLInputElement | null,
      ok: false,
    },
    {
      el: $('#card-expiry') as HTMLInputElement | null,
      ok: false,
    },
    {
      el: $('#card-cvc') as HTMLInputElement | null,
      ok: false,
    },
  ];

  if (fields.some(f => !f.el)) return false;

  fields[0].ok = fields[0].el!.value.trim().length >= 2;
  fields[1].ok = /^\d{13,19}$/.test(fields[1].el!.value.replace(/\s+/g, ''));
  fields[2].ok = isExpiryValid(fields[2].el!.value.trim());
  fields[3].ok = /^\d{3,4}$/.test(fields[3].el!.value.trim());

  fields.forEach(f => {
    if (f.ok) {
      f.el!.classList.remove('error');
    } else {
      f.el!.classList.add('error');
    }
  });

  // Premier champ invalide (aucune assignation via closure — évite CDB TS "never")
  const firstInvalid = fields.find(f => !f.ok)?.el ?? null;
  const status = $('#co-card-status');
  if (firstInvalid) {
    if (status) status.textContent =
      'Informations de carte invalides — vérifiez le n°, la date d\'expiration et le CVC. / Invalid card details — please check the number, the expiry date and the CVC.';
    firstInvalid.focus();
    return false;
  }
  if (status) status.textContent = '';
  return true;
}

// : efface l'état d'erreur d'un champ carte à la saisie
function clearCardError(input: HTMLInputElement): void {
  input.classList.remove('error');
  const status = $('#co-card-status');
  if (status && status.textContent) status.textContent = '';
}

// Charger la commande en attente (sessionStorage partagé avec la home)
function loadPending(): PendingOrder | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingOrder;
    if (!parsed?.payload || !parsed?.quote) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Initialiser la page paiement dediée
export function initCheckout(): void {
  pending = loadPending();
  const payBtn = $('#btn-pay') as HTMLButtonElement | null;

  if (!pending) {
    const grid = $('#co-recap-grid');
    if (grid) grid.innerHTML = '';
    setStatus('Aucune commande en attente. Retournez au configurateur et validez vos informations. / No pending order — please go back to the configurator.', true);
    if (payBtn) payBtn.disabled = true;
    return;
  }

  // « modifier votre commande » — retour au configurateur en gardant la
  // commande en attente (la home restaure la sélection via restore.ts)
  $$('.modifier-btn').forEach(btn => {
    btn.addEventListener('click', (e: Event) => {
      e.preventDefault();
      window.location.href = '/';
    });
  });

  // Sélection MVola / carte
  $$('.r-btn[data-pay]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.r-btn[data-pay]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      switchPaymentMethod((btn.dataset.pay as PaymentMethod) || 'Mvola');
    });
  });

  // : efface l'erreur carte à la saisie (validation locale façon référence)
  $$('.card-input').forEach(input => {
    input.addEventListener('input', () => clearCardError(input as HTMLInputElement));
  });

  if (payBtn) payBtn.addEventListener('click', onPay);

  // Requote backend + rendu du récap (temps réel)
  requote();
}
