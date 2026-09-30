export interface ConfigResponse {
  prices: { mini: number; S: number; M: number; L: number }
  vasePrice: number
  surMesureMin: number
  whatsappNumber: string
  shop: {
    name: string
    address: string
    hours: string
    instagram: string
    facebook: string
  }
  delivery: {
    retraitGratuit: boolean
    zones: { name: string; fee: number | null; quartiers: string[] }[]
  }
  faq: { q: string; a: string }[]
}

export const ConfigSchema = {
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      properties: {
        ok: { type: 'boolean' },
        config: { type: 'object', additionalProperties: true }
      }
    },
  },
} as const
