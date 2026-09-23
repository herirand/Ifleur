import { FastifyInstance } from "fastify";
import { ConfigSchema } from "./config.dto";
import { configHandler } from "./config.controller";

export default async function ConfigRoutes(app: FastifyInstance) {
  app.get('/config', { schema: ConfigSchema }, configHandler)
}
