import { FastifyReply, FastifyRequest } from "fastify";
import { SendEmailDto } from "./email.dto";
import { sendOrderEmail } from "./email.service";

export async function sendEmailHandler(
  request: FastifyRequest<{ Body: SendEmailDto }>,
  reply: FastifyReply,
) {
  await sendOrderEmail(request.body);
  return reply.send({ ok: true, message: 'Email envoye' });
}
