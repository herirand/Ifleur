// MODIFIÉ : réutilise sendOrderEmail() de modules/email (template HTML structurée) —
// la confirmation part au client (billing.email) avec des champs dédiés (pas de bloc brut).
import config from '../../config/config.json'
import { sendOrderEmail } from '../email/email.service'
import type { SendEmailDto } from '../email/email.dto'
import { validatePaymentMethod, PAYMENT_LABEL } from '../payment/payment.service'
import type { OrderDto, QuoteOrderDto, OrderSize } from './order.dto'

interface QuoteResult {
  basePrice: number
  vasePrice: number
  deliveryFee: number
  total: number | null // null = sur devis
  isDevis: boolean
  deliveryIsDevis: boolean
}

type DeliveryZone = { name: string; fee: number | null; quartiers: string[] }

function findZoneForQuartier(quartier: string): DeliveryZone | null {
  if (!quartier) return null;
  const q = quartier.trim().toLowerCase();
  let fallback: DeliveryZone | null = null;
  for (const zone of config.delivery.zones) {
    if (zone.quartiers.some(item => item.toLowerCase() === q)) return zone;
    if (zone.quartiers.length === 0 && zone.fee === null) fallback = zone;
  }
  return fallback;
}

export function computeQuote(dto: QuoteOrderDto): QuoteResult {
  const isDevis = dto.size === 'custom';
  const basePrice = isDevis ? 0 : (config.prices[dto.size as keyof typeof config.prices] ?? 0);
  const vasePrice = dto.vase ? config.vasePrice : 0;

  let deliveryFee = 0;
  let deliveryIsDevis = false;

  if (dto.deliveryMode === 'home' && dto.quartier) {
    const zone = findZoneForQuartier(dto.quartier);
    if (zone && zone.fee !== null) {
      deliveryFee = zone.fee;
    } else {
      deliveryIsDevis = true;
      deliveryFee = 0;
    }
  }

  const total = isDevis ? null : basePrice + vasePrice + deliveryFee;
  return { basePrice, vasePrice, deliveryFee, total, isDevis, deliveryIsDevis }
}

function formatAr(n: number): string {
  return n.toLocaleString('fr-FR') + ' Ar';
}

// NOUVEAU : construit les champs structurés de la template HTML EmailJS
// (fini le blob « order » illisible). Chaque valeur a sa propre variable,
// fallback « — » pour les champs absents.
export function buildOrderEmail(dto: OrderDto, q: QuoteResult): SendEmailDto {
  const sizeLabel: Record<OrderSize, string> = {
    mini: 'Mini',
    S: 'S',
    M: 'M',
    L: 'L',
    custom: 'Sur-mesure / custom (min ' + formatAr(config.surMesureMin) + ')',
  }

  const colorLabel: Record<string, string> = {
    pastel: 'pastel',
    neutre: 'neutre / neutral',
    chaud: 'chaud / warm',
    'surprenez-moi': 'surprenez-moi !',
  }

  const r = dto.recipient
  const isHome = dto.deliveryMode === 'home'

  return {
    to: dto.billing.email,
    name: dto.billing.nom,
    customer_name: dto.billing.nom || '—',
    size: sizeLabel[dto.size],
    color: colorLabel[dto.color] ?? dto.color,
    vase: dto.vase ? `Oui / Yes (+${formatAr(config.vasePrice)})` : 'Non / No',
    message: dto.message || '—',
    isPickup: !isHome,
    isHome,
    pickup_date: !isHome ? (dto.pickupDate || '—') : '—',
    delivery_date: isHome ? (dto.deliveryDate || '—') : '—',
    recipient_name: isHome ? (r?.nom || '—') : '—',
    recipient_phone: isHome ? (r?.tel || '—') : '—',
    recipient_address: isHome
      ? (r?.adresse || '—') + (r?.complement ? ' (' + r.complement + ')' : '')
      : '—',
    recipient_city: isHome ? (r?.ville || '—') : '—',
    quartier: isHome ? (dto.quartier || '—') : '—',
    delivery_fee: isHome
      ? (q.deliveryIsDevis
          ? 'sur devis / on quote'
          : q.deliveryFee === 0
            ? 'gratuit / free'
            : formatAr(q.deliveryFee))
      : '—',
    billing_name: dto.billing.nom || '—',
    billing_phone: dto.billing.tel || '—',
    billing_email: dto.billing.email || '—',
    payment_method: PAYMENT_LABEL[dto.paymentMethod] ?? dto.paymentMethod,
    total: q.isDevis ? 'sur devis / on quote' : formatAr(q.total ?? 0),
  }
}

// MODIFIÉ : création de commande — recalcul backend + email structuré au client.
export async function createOrder(dto: OrderDto): Promise<QuoteResult> {
  validatePaymentMethod(dto.paymentMethod)
  const quote = computeQuote(dto)
  await sendOrderEmail(buildOrderEmail(dto, quote))

  return quote
}