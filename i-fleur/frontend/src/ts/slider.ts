// Module carrousel d'images (slider)

import { $, $$ } from './utils.js';

// Index courant du slide actif
let current = 0;

// Nombre total de slides
const SLIDE_COUNT = 4;

// Intervalle auto-play en ms
const AUTOPLAY_MS = 4500;

// Timer de l'auto-play
let autoplayTimer: ReturnType<typeof setInterval> | null = null;

// Naviguer vers un slide spécifique
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

// Avancer au slide suivant
function next(): void {
  goTo((current + 1) % SLIDE_COUNT);
}

// Reculer au slide précédent
function prev(): void {
  goTo((current - 1 + SLIDE_COUNT) % SLIDE_COUNT);
}

// Action navigation (stop l'auto-play puis navigue)
function manualNavigate(fn: () => void): void {
  stopAutoplay();
  fn();
  startAutoplay();
}

// Démarrer l'auto-play
export function startAutoplay(): void {
  stopAutoplay();
  autoplayTimer = setInterval(next, AUTOPLAY_MS);
}

// Arrêter l'auto-play
export function stopAutoplay(): void {
  if (autoplayTimer !== null) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

// slider sans flèches (pagination numérotée seule, style saison)
export function initSlider(): void {
  const dots = $$('.dot');

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      manualNavigate(() => goTo(i));
    });
  });

  goTo(0);
  startAutoplay();
}
