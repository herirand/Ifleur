// NOUVEAU : paiement — uniquement MVola + carte. L'API externe sera intégrée plus tard.
export type PaymentMethod = 'Mvola' | 'carte'

export interface PaymentInfo {
  method: PaymentMethod
  reference?: string // référence de paiement (ex: n° transaction MVola) — optionnel pour l'instant
}

export const PaymentSchema = {
  body: {
    type: 'object',
    required: ['method'],
    additionalProperties: false,
    properties: {
      method: { type: 'string', enum: ['Mvola', 'carte'] },
      reference: { type: 'string' },
    },
  },
} as const