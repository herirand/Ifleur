// NOUVEAU : page paiement dédiée (/paiement.html) — récap de la commande en attente,
// total REQUOTÉ au backend (temps réel), choix MVola/carte, bouton « Payer » qui envoie
// la commande (POST /api/order). Le processeur de paiement réel sera branché plus tard.
// Aucun calcul de prix local.

import { $, $$, formatPrice } from './utils.js';
import type { QuoteResult, OrderSize } from './types.js';
import type { PaymentMethod } from './types-payment.js';
import { STORAGE_KEY } from './payment.js';

export interface PendingOrder {
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

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

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

// NOUVEAU : re-quoter au backend à l'arrivée sur la page (temps réel, calcul serveur)
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
  const totalTxt = currentQuote.isDevis ? 'sur devis / on quote' : formatPrice(currentQuote.total ?? 0);
  setStatus(`Total à payer : ${totalTxt} — vérifiez vos informations puis cliquez « Payer ». / Amount due: ${totalTxt} — review your details then click "Pay".`);
}

// NOUVEAU : « Payer » → POST /api/order (email client). Point d'intégration du processeur de paiement.
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

    // NOUVEAU : emplacement réservé où le processeur de paiement sera intégré (Stripe / MVola API)
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
  const backBtn = $('#btn-back');

  if (!pending) {
    const grid = $('#co-recap-grid');
    if (grid) grid.innerHTML = '';
    setStatus('Aucune commande en attente. Retournez au configurateur et validez vos informations. / No pending order — please go back to the configurator.', true);
    if (payBtn) payBtn.disabled = true;
    return;
  }

  // Sélection MVola / carte
  $$('.r-btn[data-pay]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.r-btn[data-pay]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      switchPaymentMethod((btn.dataset.pay as PaymentMethod) || 'Mvola');
    });
  });

  if (payBtn) payBtn.addEventListener('click', onPay);
  if (backBtn) backBtn.addEventListener('click', (e: Event) => {
    e.preventDefault();
    window.location.href = '/';
  });

  // Requote backend + rendu du récap (temps réel)
  requote();
}