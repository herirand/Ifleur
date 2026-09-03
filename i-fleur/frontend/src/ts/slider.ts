// NOUVEAU : Module carrousel d'images (slider)

import { $, $$ } from './utils.js';

// NOUVEAU : Index courant du slide actif
let current = 0;

// NOUVEAU : Nombre total de slides
const SLIDE_COUNT = 4;

// NOUVEAU : Intervalle auto-play en ms
const AUTOPLAY_MS = 4500;

// NOUVEAU : Timer de l'auto-play
let autoplayTimer: ReturnType<typeof setInterval> | null = null;

// NOUVEAU : Naviguer vers un slide spécifique
export function goTo(n: number): void {
  current = n;

  const slider = $('#slider') as HTMLElement | null;
  const dots = $$('.dot');

  if (slider) {
    slider.style.transform = `translateX(-${n * 100}%)`;
  }

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === n);
  });
}

// NOUVEAU : Avancer au slide suivant
function next(): void {
  goTo((current + 1) % SLIDE_COUNT);
}

// NOUVEAU : Démarrer l'auto-play
export function startAutoplay(): void {
  stopAutoplay();
  autoplayTimer = setInterval(next, AUTOPLAY_MS);
}

// NOUVEAU : Arrêter l'auto-play
export function stopAutoplay(): void {
  if (autoplayTimer !== null) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

// NOUVEAU : Initialiser le slider et les dots
export function initSlider(): void {
  const dots = $$('.dot');

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      startAutoplay();
    });
  });

  goTo(0);
  startAutoplay();
}
