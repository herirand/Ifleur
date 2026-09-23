// MODIFIÉ : use createOrder (au lieu de l'ancien sendOrderEmail dupliqué)
import { FastifyReply, FastifyRequest } from "fastify"
import { QuoteOrderDto, OrderDto } from "./order.dto"
import { computeQuote, createOrder } from "./order.service"

export async function quoteHandler(
  request: FastifyRequest<{ Body: QuoteOrderDto }>,
  reply: FastifyReply,
) {
  const q = computeQuote(request.body)
  return reply.send({
    ok: true,
    basePrice: q.basePrice,
    vasePrice: q.vasePrice,
    deliveryFee: q.deliveryFee,
    total: q.total,
    isDevis: q.isDevis,
    deliveryIsDevis: q.deliveryIsDevis,
  })
}

export async function orderHandler(
  request: FastifyRequest<{ Body: OrderDto }>,
  reply: FastifyReply,
) {
  const q = await createOrder(request.body)
  return reply.send({ ok: true, total: q.total, isDevis: q.isDevis })
}