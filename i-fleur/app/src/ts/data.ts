// Module d'accès à la configuration statique (config.json surchargé par esbuild)

import type { Config, DeliveryZone } from './types.js';

// Import direct du JSON (remplace l'ancien appel GET /api/config)
import config from './config.json';

// Référence partagée vers la configuration
export const CONFIG: Config = config;

// Accéder à une zone de livraison pour un quartier donné
// Retourne null si le quartier n'est assigné à aucune zone
export function findZoneForQuartier(quartier: string): DeliveryZone | null {
  if (!quartier) return null;
  const q = quartier.trim().toLowerCase();
  let fallback: DeliveryZone | null = null;

  for (const zone of CONFIG.delivery.zones) {
    if (zone.quartiers.some(item => item.toLowerCase() === q)) {
      return zone;
    }
    // la zone "Autre / hors zone" sert de fallback si elle existe
    if (zone.quartiers.length === 0 && zone.fee === null) {
      fallback = zone;
    }
  }

  return fallback;
}

// Aplatir tous les quartiers de toutes les zones (pour le <select>)
export function getAllQuartiers(): { quartier: string; zone: DeliveryZone }[] {
  const list: { quartier: string; zone: DeliveryZone }[] = [];
  for (const zone of CONFIG.delivery.zones) {
    if (zone.quartiers.length === 0 && zone.fee === null) {
      // la zone "hors zone" n'apparaît pas comme un quartier choisissable
      continue;
    }
    for (const quartier of zone.quartiers) {
      list.push({ quartier, zone });
    }
  }
  return list;
}
