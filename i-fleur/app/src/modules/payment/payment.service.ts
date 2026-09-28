import { AppError } from '../../lib/appError'
import { PAYMENT_METHODS } from './payment.dto'
import type { PaymentMethod } from './payment.dto'

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  Mvola: 'MVola · 034 04 764 14',
  carte: 'Carte bancaire',
}

export function validatePaymentMethod(method: PaymentMethod): void {
  if (!(PAYMENT_METHODS as readonly string[]).includes(method)) {
    throw new AppError(400, 'Méthode de paiement non supportée', 'PAYMENT_METHOD_UNSUPPORTED')
  }
}
