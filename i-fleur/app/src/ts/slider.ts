// module carrousel type saison-eshop — crossfade (fade), loop, puces numérotées.
// : autoplay 5 s, avec remise à zéro du chrono à chaque navigation manuelle,
// pause au survol / onglet caché / prefers-reduced-motion.

import { $, $$ } from './utils.js';

// Index du slide actif
let current = 0;

// Nombre total de slides
const SLIDE_COUNT = 4;

// : intervalle d'autoplay (4 s — 4 photos => cycle complet en 16 s)
const AUTOPLAY_MS = 4000;

// : état du carrefour — timer + 3 sources de pause
let timer: number | null = null;
let hovered = false;
let docHidden = false;
let reducedMotion = false;

// Naviguer vers un slide spécifique (loop géré par le modulo)
function goTo(n: number): void {
  current = (n + SLIDE_COUNT) % SLIDE_COUNT;

  $$('#slider .slide').forEach((slide, i) => {
    slide.classList.toggle('active', i === current);
  });

  $$('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === current);
  });
}

// Avancer au slide suivant (loop)
function next(): void {
  goTo(current + 1);
}

// Reculer au slide précédent (loop)
function prev(): void {
  goTo(current - 1);
}

// : arrêter l'autoplay
function stopAutoplay(): void {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}

// : (re)lancer l'autoplay. Le clearInterval préalable est ce qui fait
// « repartir le chrono » : une photo choisie à la main reste affichée 5 s pleines.
function startAutoplay(): void {
  stopAutoplay();
  timer = window.setInterval(next, AUTOPLAY_MS);
}

// : source unique de vérité play/pause — évite 3 chemins d'arrêt qui divergeraient.
// Un clic pendant le survol ne relance rien (hovered reste vrai) : sinon impossible de figer.
function syncAutoplay(): void {
  if (hovered || docHidden || reducedMotion) stopAutoplay();
  else startAutoplay();
}

// init — puces numérotées + flèches prev/next + autoplay
export function initSlider(): void {
  // : syncAutoplay() après chaque navigation manuelle = le chrono repart à 5 s
  $$('.dot').forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      syncAutoplay();
    });
  });

  const prevBtn = $('.slide-arrow.prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prev();
      syncAutoplay();
    });
  }

  const nextBtn = $('.slide-arrow.next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      next();
      syncAutoplay();
    });
  }

  // : pause au survol de la colonne photo. On cible .col-photo (et non #slider)
  // parce que les flèches et les puces en sont des SŒURS, pas des enfants : le survol
  // sur un bouton ne déclencherait pas un mouseenter posé sur #slider.
  const zone = $('.col-photo') || $('#slider');
  if (zone) {
    zone.addEventListener('mouseenter', () => {
      hovered = true;
      syncAutoplay();
    });
    zone.addEventListener('mouseleave', () => {
      hovered = false;
      syncAutoplay();
    });
  }

  // : onglet caché = pause — évite de télécharger des photos en arrière-plan
  document.addEventListener('visibilitychange', () => {
    docHidden = document.hidden;
    syncAutoplay();
  });

  // : pas d'autoplay si l'OS demande moins de mouvement. Le CSS coupe déjà les
  // transitions dans ce cas ; sans cette porte, on enverrait du mouvement à un visiteur
  // qui l'a explicitement refusé.
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion = motionQuery.matches;
  motionQuery.addEventListener('change', e => {
    reducedMotion = e.matches;
    syncAutoplay();
  });

  goTo(0);
  syncAutoplay();
}
