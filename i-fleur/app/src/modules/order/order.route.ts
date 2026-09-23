import { FastifyInstance } from "fastify"
import { QuoteSchema, OrderSchema } from "./order.dto"
import { quoteHandler, orderHandler } from "./order.controller"

export default async function OrderRoutes(app: FastifyInstance) {
  app.post('/order/quote', { schema: QuoteSchema }, quoteHandler)
  app.post('/order', { schema: OrderSchema }, orderHandler)
}
