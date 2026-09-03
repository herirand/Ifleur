// MODIFIÉ : Point d'entrée du frontend i.fleur (vitrine 100% statique)

import { initSlider } from './slider.js';
import { initPricing } from './pricing.js';
import { initSelectors } from './selectors.js';
import { initDelivery } from './delivery.js';
import { initPayment } from './payment.js';
import { initBilling } from './billing.js';
import { CONFIG } from './data.js';
import { $, $$ } from './utils.js';

// NOUVEAU : Initialiser l'application (aucun appel réseau, config embarquée)
function init(): void {
  initSlider();
  initPricing();
  initSelectors();
  initDelivery();
  initBilling();
  initPayment();
  applyShopConfig();
}

// NOUVEAU : Appliquer les infos boutique (nom, adresse, contact) depuis config.json
function applyShopConfig(): void {
  const setText = (id: string, value: string): void => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  if (CONFIG.shop.name) setText('shop-name', CONFIG.shop.name);
  if (CONFIG.shop.address) setText('shop-address', CONFIG.shop.address);
  if (CONFIG.shop.hours) setText('shop-hours', CONFIG.shop.hours);
  if (CONFIG.shop.instagram) setText('shop-instagram', CONFIG.shop.instagram);
  if (CONFIG.shop.facebook) setText('shop-facebook', CONFIG.shop.facebook);

  // NOUVEAU : construire la FAQ depuis config.json
  const faqSection = $('#faq-container');
  if (faqSection) {
    faqSection.innerHTML = CONFIG.faq
      .map(
        (item, i) => `
        <div class="faq-item">
          <button class="faq-q" data-faq-index="${i}"><span>${item.q}</span><span class="faq-toggle">+</span></button>
          <div class="faq-a"><div class="faq-a-inner">${item.a}</div></div>
        </div>`
      )
      .join('');
  }

  // NOUVEAU : réattacher les listeners FAQ après construction dynamique
  $$('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (item) item.classList.toggle('open');
    });
  });
}

// MODIFIÉ : Démarrer dès que le DOM est prêt (pas d'async, pas de fetch)
document.addEventListener('DOMContentLoaded', init);
