// NOUVEAU : Module sélecteurs UI (couleurs)

import { $$ } from './utils.js';

// NOUVEAU : Couleur florale sélectionnée
let selectedColor: string = 'neutre';

// NOUVEAU : Gérer la sélection de couleur
export function selectColor(btn: HTMLElement): void {
  const buttons = $$('#color-row .col-btn');
  buttons.forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  const parent = btn.closest('.col-opt');
  if (parent) {
    const classList = Array.from(parent.classList);
    const colorClass = classList.find(c =>
      ['neutre', 'froid', 'chaud', 'nuance'].includes(c)
    );
    if (colorClass) {
      selectedColor = colorClass;
    }
  }
}

// NOUVEAU : Récupérer la couleur sélectionnée
export function getSelectedColor(): string {
  return selectedColor;
}

// NOUVEAU : Initialiser les event listeners couleurs
export function initSelectors(): void {
  $$('#color-row .col-btn').forEach(btn => {
    btn.addEventListener('click', () => selectColor(btn));
  });
}
