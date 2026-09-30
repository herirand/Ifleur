// serveur monolithe Fastify — sert l'API (/api) + le frontend statique (public/)
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify, { FastifyError } from "fastify";
import dotenv from 'dotenv'
import * as path from 'node:path'
import { AppError } from "./lib/appError";
import { ensureFrontendBuilt } from "./buildStatic";
import RegisterRoutes from "./routes/routes";
dotenv.config()

// Racine web : dossier public/ (seule partie exposée — jamais src/ts ni .env)
const PUBLIC_DIR = path.join(process.cwd(), 'public')

const app = Fastify({ logger: true })

// CORS restreint aux origines locales (monolithe same-origin)
app.register(fastifyCors, {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

app.setErrorHandler((error: FastifyError, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.code,
      message: error.message
    })
  }
  // : gère valablement les erreurs Fastify hors AppError
  // (validation 400, payload 413...) en réutilisant le statusCode de l'erreur,
  // sinon repli 500 — évite une réponse suspendue.
  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
  const code = statusCode >= 500 ? 'INTERNAL_ERROR' : (error.code || 'VALIDATION_ERROR');
  request.log.error({ err: error }, `Erreur HTTP ${statusCode}`);
  return reply.status(statusCode).send({ statusCode, error: code, message: error.message });
})

// API d'abord (prefix /api) — les routes exactes gagnent sur le wildcard statique
app.register(RegisterRoutes, { prefix: '/api' })

// : sert le frontend statique (index.html, src/*, dist/app.js) depuis public/
app.register(fastifyStatic, {
  root: PUBLIC_DIR,
})

// : SPA fallback — toute route GET inconnue (hors /api et hors fichier)
// renvoie index.html. Les chemins "fichier" (extension) et les dotfiles
// (/.env, /.gitignore, /src/ts/*) restent un vrai 404 : jamais l'HTML.
const HAS_FILE_EXT = /\/[^/]+\.[a-zA-Z0-9]{1,6}$/;
const HAS_HIDDEN_SEGMENT = /\/(\.[^/]+)/;
app.setNotFoundHandler((request, reply) => {
  const pathname = request.url.split('?')[0];
  const isApi = request.url.startsWith('/api');
  const looksLikeFile = HAS_FILE_EXT.test(pathname) || HAS_HIDDEN_SEGMENT.test(pathname);
  if (request.method !== 'GET' || isApi || looksLikeFile) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'NOT_FOUND',
      message: 'Ressource introuvable'
    });
  }
  return reply.sendFile('index.html');
})

const start = async () => {
  try {
    // : builde le bundle frontend au démarrage (watch en dev, once en prod)
    await ensureFrontendBuilt({ watch: process.env.NODE_ENV !== 'production' })
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`serveur listening at port: 3000`);
  } catch (error) {
    app.log.error(error);
    console.log('Serveur exiting');
    process.exit(1);
  }
}

start()
