// NOUVEAU : Module d'accès à la configuration statique (config.json surchargé par esbuild)

import type { Config, DeliveryZone } from './types.js';

// MODIFIÉ : Import direct du JSON (remplace l'ancien appel GET /api/config)
import config from './config.json';

// NOUVEAU : Référence partagée vers la configuration
export const CONFIG: Config = config;

// NOUVEAU : Accéder à une zone de livraison pour un quartier donné
// Retourne null si le quartier n'est assigné à aucune zone
export function findZoneForQuartier(quartier: string): DeliveryZone | null {
  if (!quartier) return null;
  const q = quartier.trim().toLowerCase();
  let fallback: DeliveryZone | null = null;

  for (const zone of CONFIG.delivery.zones) {
    if (zone.quartiers.some(item => item.toLowerCase() === q)) {
      return zone;
    }
    // NOUVEAU : la zone "Autre / hors zone" sert de fallback si elle existe
    if (zone.quartiers.length === 0 && zone.fee === null) {
      fallback = zone;
    }
  }

  return fallback;
}

// NOUVEAU : Aplatir tous les quartiers de toutes les zones (pour le <select>)
export function getAllQuartiers(): { quartier: string; zone: DeliveryZone }[] {
  const list: { quartier: string; zone: DeliveryZone }[] = [];
  for (const zone of CONFIG.delivery.zones) {
    if (zone.quartiers.length === 0 && zone.fee === null) {
      // NOUVEAU : la zone "hors zone" n'apparaît pas comme un quartier choisissable
      continue;
    }
    for (const quartier of zone.quartiers) {
      list.push({ quartier, zone });
    }
  }
  return list;
}
