import { AppError } from '../../lib/appError'
import { PAYMENT_METHODS } from './payment.dto'
import type { PaymentMethod } from './payment.dto'

// MODIFIÉ : entrée « carte » retirée (présentation) — à modifier avec payment.dto.ts,
// sinon l'exhaustivité de Record<PaymentMethod, string> casse la compilation.
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  Mvola: 'MVola · 034 04 764 14',
}

export function validatePaymentMethod(method: PaymentMethod): void {
  if (!(PAYMENT_METHODS as readonly string[]).includes(method)) {
    throw new AppError(400, 'Méthode de paiement non supportée', 'PAYMENT_METHOD_UNSUPPORTED')
  }
}
