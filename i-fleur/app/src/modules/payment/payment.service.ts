// NOUVEAU : services paiement MVola + carte.
// Point d'insertion de l'API externe marqué ci-dessous (à brancher plus tard).
import { AppError } from '../../lib/appError'
import type { PaymentInfo, PaymentMethod } from './payment.dto'

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  Mvola: 'MVola · 034 04 764 14',
  carte: 'Carte bancaire',
}

export function validatePaymentMethod(method: PaymentMethod): void {
  if (method !== 'Mvola' && method !== 'carte') {
    throw new AppError(400, 'Méthode de paiement non supportée', 'PAYMENT_METHOD_UNSUPPORTED')
  }
}

// NOUVEAU : validation + traitement du paiement.
// TODO API externe: intégrer ici le SDK/API de paiement (MVola + carte).
export async function processPayment(payment: PaymentInfo): Promise<{ status: 'pending' | 'paid'; reference?: string }> {
  validatePaymentMethod(payment.method)
  // Placeholder en attendant l'API externe de paiement.
  return { status: 'pending', reference: payment.reference }
}