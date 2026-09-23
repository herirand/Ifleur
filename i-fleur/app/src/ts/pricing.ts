// MODIFIÉ : aucun calcul de prix local — la sélection est envoyée au backend
// (POST /api/order/quote, débouncé 150 ms pour un rendu temps réel) et le résultat serveur est affiché.

import { $, $$, formatPrice } from './utils.js';
import { getConfig } from './data.js';
import type { OrderSize, OrderDelivery, QuoteResult } from './types.js';

interface Selection {
  size: OrderSize;
  vase: boolean;
  deliveryMode: OrderDelivery;
  quartier: string;
}

let selection: Selection = { size: 'S', vase: false, deliveryMode: 'pickup', quartier: '' };

let quote: QuoteResult = {
  basePrice: 0,
  vasePrice: 0,
  deliveryFee: 0,
  total: null,
  isDevis: false,
  deliveryIsDevis: false,
};

type QuoteListener = (q: QuoteResult) => void;
const listeners: QuoteListener[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

export function setSelection(patch: Partial<Selection>): void {
  selection = { ...selection, ...patch };
  scheduleQuote();
}

export function getSelection(): Selection {
  return { ...selection };
}

export function getQuoteResult(): QuoteResult {
  return { ...quote };
}

export function onQuoteChange(fn: QuoteListener): void {
  listeners.push(fn);
}

function notify(): void {
  listeners.forEach(fn => fn({ ...quote }));
}

function scheduleQuote(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchQuote, 150);
}

async function fetchQuote(): Promise<void> {
  try {
    const res = await fetch('/api/order/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selection),
    });
    if (!res.ok) throw new Error('quote failed');
    const data = await res.json();
    quote = {
      basePrice: data.basePrice,
      vasePrice: data.vasePrice,
      deliveryFee: data.deliveryFee,
      total: data.total,
      isDevis: data.isDevis,
      deliveryIsDevis: data.deliveryIsDevis,
    };
    updateTotal();
    refreshRecap();
    notify();
  } catch (err) {
    console.error(err);
  }
}

export function updateTotal(): void {
  const display = $('#total-display');
  if (!display) return;
  if (quote.isDevis) {
    display.textContent = 'sur devis / on quote';
  } else if (quote.total === null) {
    display.textContent = '—';
  } else {
    display.textContent = formatPrice(quote.total);
  }
}

export function refreshRecap(): void {
  const setText = (id: string, value: string): void => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const sizeBtn = document.querySelector('#size-row .c-btn.selected') as HTMLElement | null;
  const sizeLabel = sizeBtn?.dataset.size === 'custom'
    ? 'Sur-mesure / Custom'
    : (sizeBtn?.textContent?.trim() || '—');
  const colorEl = (document.querySelector('#color-row .col-btn.selected') as HTMLElement | null)?.closest('.col-opt') as HTMLElement | null;
  const colorClass = colorEl ? Array.from(colorEl.classList).find(c => ['pastel', 'chaud', 'surprenez-moi', 'neutre'].includes(c)) || '—' : '—';
  const vaseBtn = document.querySelector('#vase-row .r-btn.selected') as HTMLElement | null;
  const withVase = vaseBtn?.dataset.vase === '1';
  const message = (document.getElementById('message') as HTMLTextAreaElement)?.value?.trim() || '—';

  setText('recap-size', sizeLabel);
  setText('recap-color', colorClass.charAt(0).toUpperCase() + colorClass.slice(1));
  setText('recap-vase', withVase ? `Oui / Yes (+${formatPrice(getConfig().vasePrice)})` : 'Non / No');
  setText('recap-message', message);
  setText('recap-prix', quote.isDevis ? 'Sur devis / On quote' : formatPrice(quote.basePrice));
  setText('recap-frais',
    quote.deliveryIsDevis ? 'Sur devis / On quote'
      : (quote.deliveryFee === 0 ? 'Gratuit / Free' : formatPrice(quote.deliveryFee)));
}

export function initPricing(): void {
  const sizeBtn = document.querySelector('#size-row .c-btn.selected') as HTMLElement | null;
  const size = sizeBtn?.dataset.size as OrderSize | undefined;
  if (size) selection.size = size;

  const vaseBtn = document.querySelector('#vase-row .r-btn.selected') as HTMLElement | null;
  selection.vase = vaseBtn?.dataset.vase === '1';

  $$('#size-row .c-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // MODIFIÉ : bascule visuelle du cercle (référence saison-eshop) — le cercle cliqué
      // passe en fond noir, les autres reviennent en fond blanc.
      $$('#size-row .c-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const s = btn.dataset.size as OrderSize | undefined;
      if (s) {
        setSelection({ size: s });
        const smBlock = document.getElementById('size-surmesure-block');
        if (smBlock) smBlock.classList.toggle('visible', s === 'custom');
      }
    });
  });

  // MODIFIÉ : bascule visuelle du carré (même logique que les tailles) —
  // la classe .selected pilotait le visuel mais n'était plus togglée (bug).
  $$('#vase-row .r-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#vase-row .r-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      setSelection({ vase: btn.dataset.vase === '1' });
    });
  });

  onQuoteChange(() => refreshRecap());

  updateTotal();
  refreshRecap();
  scheduleQuote();
}