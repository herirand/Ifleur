import { FastifyInstance } from "fastify";
import EmailRoutes from "../modules/email/email.route";

async function RegisterRoutes(app: FastifyInstance) {
  await app.register(EmailRoutes);
}

export default RegisterRoutes;
