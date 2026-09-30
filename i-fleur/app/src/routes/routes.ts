import { FastifyInstance } from "fastify";
import ConfigRoutes from "../modules/config/config.route";
import OrderRoutes from "../modules/order/order.route";

async function RegisterRoutes(app: FastifyInstance) {
  await app.register(ConfigRoutes);
  await app.register(OrderRoutes);
}

export default RegisterRoutes;
