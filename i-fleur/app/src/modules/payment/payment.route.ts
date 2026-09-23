// NOUVEAU : route POST /api/payment
import { FastifyInstance } from "fastify"
import { PaymentSchema } from "./payment.dto"
import { paymentHandler } from "./payment.controller"

export default async function PaymentRoutes(app: FastifyInstance) {
  app.post('/payment', { schema: PaymentSchema }, paymentHandler)
}