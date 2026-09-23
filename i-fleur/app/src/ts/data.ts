// MODIFIÉ : charge la config depuis le backend (GET /api/config) — plus d'import config.json

import type { Config, DeliveryZone } from './types.js';

let CONFIG: Config | null = null;

// Charger la config depuis le serveur (appelée une fois, avant init*)
export async function loadConfig(): Promise<Config> {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Impossible de charger la configuration');
  const data = await res.json();
  const config: Config = data.config ?? data;
  CONFIG = config;
  return config;
}

// Accès à la config chargée (erreur si loadConfig() pas encore résolu)
export function getConfig(): Config {
  if (!CONFIG) throw new Error('Configuration non chargée');
  return CONFIG;
}

// NOUVEAU : localiser la zone de livraison d'un quartier donné
export function findZoneForQuartier(quartier: string): DeliveryZone | null {
  if (!CONFIG || !quartier) return null;
  const q = quartier.trim().toLowerCase();
  let fallback: DeliveryZone | null = null;

  for (const zone of CONFIG.delivery.zones) {
    if (zone.quartiers.some(item => item.toLowerCase() === q)) return zone;
    if (zone.quartiers.length === 0 && zone.fee === null) fallback = zone;
  }

  return fallback;
}

// NOUVEAU : liste à plat de tous les quartiers (pour le <select>)
export function getAllQuartiers(): { quartier: string; zone: DeliveryZone }[] {
  const list: { quartier: string; zone: DeliveryZone }[] = [];
  if (!CONFIG) return list;

  for (const zone of CONFIG.delivery.zones) {
    if (zone.quartiers.length === 0 && zone.fee === null) continue;
    for (const quartier of zone.quartiers) list.push({ quartier, zone });
  }
  return list;
}