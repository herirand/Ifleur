import { PAYMENT_METHODS } from '../payment/payment.dto'
import type { PaymentMethod } from '../payment/payment.dto'

export type OrderSize = 'mini' | 'S' | 'M' | 'L' | 'custom';
type OrderDelivery = 'pickup' | 'home';
type OrderColor = 'pastel' | 'chaud' | 'surprenez-moi' | 'neutre';

export interface QuoteOrderDto {
  size: OrderSize
  vase: boolean
  deliveryMode: OrderDelivery
  quartier?: string
}

export interface OrderDto {
  size: OrderSize
  vase: boolean
  color: OrderColor
  message: string
  deliveryMode: OrderDelivery
  quartier?: string
  pickupDate?: string
  deliveryDate?: string
  recipient?: {
    nom: string
    tel: string
    adresse: string
    complement: string
    ville: string
  }
  billing: {
    nom: string
    tel: string
    email: string
    adresse: string
    ville: string
  }
  paymentMethod: PaymentMethod
}

const SizeEnum = ['mini', 'S', 'M', 'L', 'custom'];
const DeliveryEnum = ['pickup', 'home'];
const ColorEnum = ['pastel', 'chaud', 'surprenez-moi', 'neutre'];

export const QuoteSchema = {
  body: {
    type: 'object',
    required: ['size', 'vase', 'deliveryMode'],
    additionalProperties: false,
    properties: {
      size: { type: 'string', enum: SizeEnum },
      vase: { type: 'boolean' },
      deliveryMode: { type: 'string', enum: DeliveryEnum },
      quartier: { type: 'string' },
    },
  },
} as const

export const OrderSchema = {
  body: {
    type: 'object',
    required: ['size', 'vase', 'color', 'deliveryMode', 'billing', 'paymentMethod'],
    additionalProperties: false,
    properties: {
      size: { type: 'string', enum: SizeEnum },
      vase: { type: 'boolean' },
      color: { type: 'string', enum: ColorEnum },
      message: { type: 'string' },
      deliveryMode: { type: 'string', enum: DeliveryEnum },
      quartier: { type: 'string' },
      pickupDate: { type: 'string' },
      deliveryDate: { type: 'string' },
      recipient: {
        type: 'object',
        additionalProperties: false,
        properties: {
          nom: { type: 'string' },
          tel: { type: 'string' },
          adresse: { type: 'string' },
          complement: { type: 'string' },
          ville: { type: 'string' },
        },
      },
      billing: {
        type: 'object',
        required: ['nom', 'tel', 'email'],
        additionalProperties: false,
        properties: {
          nom: { type: 'string', minLength: 1 },
          tel: { type: 'string', minLength: 1 },
          email: { type: 'string', minLength: 1 },
          adresse: { type: 'string' },
          ville: { type: 'string' },
        },
      },
      paymentMethod: { type: 'string', enum: PAYMENT_METHODS },
    },
  },
} as const
