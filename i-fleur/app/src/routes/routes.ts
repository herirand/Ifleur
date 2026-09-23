// MODIFIÉ : enregistrement modules config + order + payment
import { FastifyInstance } from "fastify";
import EmailRoutes from "../modules/email/email.route";
import ConfigRoutes from "../modules/config/config.route";
import OrderRoutes from "../modules/order/order.route";
import PaymentRoutes from "../modules/payment/payment.route";

async function RegisterRoutes(app: FastifyInstance) {
  await app.register(EmailRoutes);
  await app.register(ConfigRoutes);
  await app.register(OrderRoutes);
  await app.register(PaymentRoutes);
}

export default RegisterRoutes;