export interface SendEmailDto {
  to: string
  name: string
  order: string
  total: string
}

export const SendEmailSchema = {
  body: {
    type: 'object',
    required: ['to', 'name', 'order', 'total'],
    additionalProperties: false,
    properties: {
      to: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1 },
      order: { type: 'string', minLength: 1 },
      total: { type: 'string', minLength: 1 },
    },
  },
} as const
