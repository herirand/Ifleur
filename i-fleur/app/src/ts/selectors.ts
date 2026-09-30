// Module sélecteurs UI (couleurs)

import { $$ } from './utils.js';
import { ORDER_COLORS } from './types.js';
import type { OrderColor } from './types.js';

// Couleur florale sélectionnée (défaut : neutre vert & blanc)
let selectedColor: OrderColor = 'neutre';

// Gérer la sélection de couleur (nouvelles palettes pastel / chaud / surprenez-moi / neutre)
export function selectColor(btn: HTMLElement): void {
  const buttons = $$('#color-row .col-btn');
  buttons.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  const parent = btn.closest('.col-opt');
  if (parent) {
    const classList = Array.from(parent.classList);
    const colorClass = classList.find(c => (ORDER_COLORS as readonly string[]).includes(c));
    if (colorClass) {
      selectedColor = colorClass as OrderColor;
    }
  }
}

// Récupérer la couleur sélectionnée
export function getSelectedColor(): OrderColor {
  return selectedColor;
}

// Initialiser les event listeners couleurs
export function initSelectors(): void {
  $$('#color-row .col-btn').forEach(btn => {
    btn.addEventListener('click', () => selectColor(btn));
  });
}
