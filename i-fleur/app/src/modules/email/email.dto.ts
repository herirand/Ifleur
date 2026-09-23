// MODIFIÉ : champs structurés pour la template HTML EmailJS (plus de bloc « order » brut).
// Chaque valeur possède sa propre variable → l'email devient lisible et professionnel.
export interface SendEmailDto {
  to: string
  name: string
  customer_name: string
  size: string
  color: string
  vase: string
  message: string
  isPickup: boolean
  isHome: boolean
  pickup_date: string
  delivery_date: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  recipient_city: string
  quartier: string
  delivery_fee: string
  billing_name: string
  billing_phone: string
  billing_email: string
  payment_method: string
  total: string
}

export const SendEmailSchema = {
  body: {
    type: 'object',
    required: [
      'to', 'name', 'customer_name',
      'size', 'color', 'vase', 'message',
      'isPickup', 'isHome',
      'pickup_date', 'delivery_date',
      'recipient_name', 'recipient_phone', 'recipient_address', 'recipient_city',
      'quartier', 'delivery_fee',
      'billing_name', 'billing_phone', 'billing_email',
      'payment_method', 'total',
    ],
    additionalProperties: false,
    properties: {
      to: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1 },
      customer_name: { type: 'string' },
      size: { type: 'string' },
      color: { type: 'string' },
      vase: { type: 'string' },
      message: { type: 'string' },
      isPickup: { type: 'boolean' },
      isHome: { type: 'boolean' },
      pickup_date: { type: 'string' },
      delivery_date: { type: 'string' },
      recipient_name: { type: 'string' },
      recipient_phone: { type: 'string' },
      recipient_address: { type: 'string' },
      recipient_city: { type: 'string' },
      quartier: { type: 'string' },
      delivery_fee: { type: 'string' },
      billing_name: { type: 'string' },
      billing_phone: { type: 'string' },
      billing_email: { type: 'string' },
      payment_method: { type: 'string' },
      total: { type: 'string', minLength: 1 },
    },
  },
} as const