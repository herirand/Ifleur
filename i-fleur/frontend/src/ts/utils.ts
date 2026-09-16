// Fonctions utilitaires pour le frontend i.fleur

// Formater un nombre en prix Ariary "40 000 Ar"
export function formatPrice(n: number): string {
  return n.toLocaleString('fr-FR') + ' Ar';
}

// Générer un identifiant unique pour les éléments DOM
export function generateId(): string {
  return '_' + Math.random().toString(36).substring(2, 11);
}

// Sélecteur DOM simple (querySelector wrapper)
export function $<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

// Sélecteur DOM multiple (querySelectorAll wrapper)
export function $$<T extends HTMLElement = HTMLElement>(selector: string): T[] {
  return Array.from(document.querySelectorAll<T>(selector));
}
