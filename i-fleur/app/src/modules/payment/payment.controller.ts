// NOUVEAU : handler POST /api/payment (prêt pour l'API externe)
import { FastifyReply, FastifyRequest } from "fastify"
import { PaymentInfo } from "./payment.dto"
import { processPayment } from "./payment.service"

export async function paymentHandler(
  request: FastifyRequest<{ Body: PaymentInfo }>,
  reply: FastifyReply,
) {
  const result = await processPayment(request.body)
  return reply.send({ ok: true, status: result.status, reference: result.reference ?? null })
}