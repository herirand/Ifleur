// NOUVEAU : Fonctions utilitaires pour le frontend i.fleur

// NOUVEAU : Formater un nombre en prix Ariary "40 000 Ar"
export function formatPrice(n: number): string {
  return n.toLocaleString('fr-FR') + ' Ar';
}

// NOUVEAU : Générer un identifiant unique pour les éléments DOM
export function generateId(): string {
  return '_' + Math.random().toString(36).substring(2, 11);
}

// NOUVEAU : Sélecteur DOM simple (querySelector wrapper)
export function $<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

// NOUVEAU : Sélecteur DOM multiple (querySelectorAll wrapper)
export function $$<T extends HTMLElement = HTMLElement>(selector: string): T[] {
  return Array.from(document.querySelectorAll<T>(selector));
}
