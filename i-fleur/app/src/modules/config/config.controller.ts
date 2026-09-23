import { FastifyReply, FastifyRequest } from "fastify";
import { getConfig } from "./config.service";

export async function configHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ ok: true, config: getConfig() })
}
