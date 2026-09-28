// Fonctions utilitaires pour le frontend i.fleur

// Formater un nombre en prix Ariary "40 000 Ar"
export function formatPrice(n: number): string {
  return n.toLocaleString('fr-FR') + ' Ar';
}

// Sélecteur DOM simple (querySelector wrapper)
export function $<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

// Sélecteur DOM multiple (querySelectorAll wrapper)
export function $$<T extends HTMLElement = HTMLElement>(selector: string): T[] {
  return Array.from(document.querySelectorAll<T>(selector));
}

// : setText — helper unique pour écrire un texte par id (factorise les
// 3 copies locales qui existaient dans main.ts / pricing.ts / checkout.ts)
export function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
