import { FastifyInstance } from "fastify";
import { SendEmailSchema } from "./email.dto";
import { sendEmailHandler } from "./email.controller";

export default async function EmailRoutes(app: FastifyInstance) {
  app.post('/email/send', { schema: SendEmailSchema }, sendEmailHandler);
}
