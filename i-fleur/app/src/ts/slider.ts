// MODIFIÉ : module carrousel type saison-eshop — crossfade (fade), loop, puces numérotées.
// Plus d'autoplay (référence : Swiper effect fade, speed 100 ms, PAS d'autoplay).

import { $, $$ } from './utils.js';

// Index du slide actif
let current = 0;

// Nombre total de slides
const SLIDE_COUNT = 4;

// Naviguer vers un slide spécifique (loop géré par le modulo)
export function goTo(n: number): void {
  current = (n + SLIDE_COUNT) % SLIDE_COUNT;

  $$('#slider .slide').forEach((slide, i) => {
    slide.classList.toggle('active', i === current);
  });

  $$('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === current);
  });
}

// Avancer au slide suivant (loop)
export function next(): void {
  goTo(current + 1);
}

// Reculer au slide précédent (loop)
export function prev(): void {
  goTo(current - 1);
}

// init — puces numérotées + flèches prev/next, navigation manuelle seule (pas d'autoplay)
export function initSlider(): void {
  $$('.dot').forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
  });

  const prevBtn = $('.slide-arrow.prev');
  if (prevBtn) prevBtn.addEventListener('click', () => prev());

  const nextBtn = $('.slide-arrow.next');
  if (nextBtn) nextBtn.addEventListener('click', () => next());

  goTo(0);
}