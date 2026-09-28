// routeur — la boutique (/) et la page paiement (/paiement.html) partagent le
// même bundle. La page paiement est détectée via #checkout-page (id jugé absent sur la home).

import { initSlider } from './slider.js';
import { initPricing } from './pricing.js';
import { initSelectors } from './selectors.js';
import { initDelivery } from './delivery.js';
import { initBilling } from './billing.js';
import { initPayment } from './payment.js';
import { initCheckout } from './checkout.js';
import { restoreSelection } from './restore.js';
import { loadConfig, getConfig } from './data.js';
import { $, formatPrice, setText } from './utils.js';

async function init(): Promise<void> {
  await loadConfig();
  initSlider();
  initPricing();
  initSelectors();
  initDelivery();
  initBilling();
  initPayment();
  restoreSelection();
  applyShopConfig();
  renderPricesFromConfig();
}

// applique les infos boutique depuis la config chargée (plus de CONFIG global)
function applyShopConfig(): void {
  const CONFIG = getConfig();

  if (CONFIG.shop.name) setText('shop-name', CONFIG.shop.name);
  if (CONFIG.shop.address) setText('shop-address', CONFIG.shop.address);
  if (CONFIG.shop.hours) {
    setText('shop-hours', CONFIG.shop.hours);
    // horaires du retrait-atelier servies par la config aussi (plus de texte en dur)
    setText('shop-pickup-hours', CONFIG.shop.hours);
  }
  if (CONFIG.shop.instagram) setText('shop-instagram', CONFIG.shop.instagram);
  if (CONFIG.shop.facebook) setText('shop-facebook', CONFIG.shop.facebook);

  const faqSection = $('#faq-container');
  if (!faqSection) return;

  faqSection.innerHTML = CONFIG.faq
    .map(
      (item, i) => `
      <div class="faq-item">
        <button class="faq-q" data-faq-index="${i}"><span>${item.q}</span><span class="faq-toggle">+</span></button>
        <div class="faq-a"><div class="faq-a-inner">${item.a}</div></div>
      </div>`
    )
    .join('');

  // : délégation d'événement (1 seul écouteur) au lieu de $$('.faq-q') qui
  // re-requêtait le DOM juste après l'injection. Les .faq-q sont créés ci-dessus,
  // donc ils ne peuvent pas être captés avant cette injection.
  faqSection.addEventListener('click', (e: Event) => {
    const q = (e.target as HTMLElement).closest('.faq-q');
    const item = q?.closest('.faq-item');
    if (item) item.classList.toggle('open');
  });
}

// : les montants affichés (c-label) viennent du serveur — aucun data-price HTML
function renderPricesFromConfig(): void {
  const CONFIG = getConfig();

  document.querySelectorAll<HTMLElement>('#size-row .c-btn').forEach(btn => {
    const size = btn.dataset.size as keyof typeof CONFIG.prices | 'custom' | undefined;
    const label = btn.querySelector<HTMLElement>('.c-label') ||
      btn.closest('.c-opt')?.querySelector<HTMLElement>('.c-label');
    if (label) {
      if (size && size !== 'custom' && CONFIG.prices[size] !== undefined) {
        label.textContent = formatPrice(CONFIG.prices[size]);
      }
      if (size === 'custom') label.textContent = 'min ' + formatPrice(CONFIG.surMesureMin);
    }
  });

  const vaseOui = document.querySelector<HTMLElement>('#vase-row .r-btn[data-vase="1"]');
  if (vaseOui) vaseOui.textContent = `oui / yes (+${formatPrice(CONFIG.vasePrice)})`;

  const smBlock = $('#size-surmesure-block');
  if (smBlock) smBlock.textContent =
    `à partir de ${formatPrice(CONFIG.surMesureMin)} — prix sur devis / from ${formatPrice(CONFIG.surMesureMin)} — quoted price`;
}

// démarrage — route page paiement sinon boutique
// la page paiement reprend le design boutique (header logo + photo split-screen)
// donc le slider (mêmes IDs que la home) y est aussi initialisé.
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#checkout-page')) {
    initSlider();
    // : /paiement.html charge aussi la config — il a besoin de whatsappNumber
    // pour le lien « envoyer la capture de paiement ». Avant, ce chemin n'appelait pas
    // loadConfig(), donc getConfig() y levait « Configuration non chargée ».
    // En cas d'échec on démarre quand même le checkout (seul le lien WhatsApp reste vide).
    loadConfig()
      .catch(err => { console.error(err); })
      .then(() => initCheckout());
    return;
  }
  init().catch(err => {
    console.error(err);
    const status = $('#order-status');
    if (status) status.textContent = 'Erreur de chargement / load error';
  });
});
