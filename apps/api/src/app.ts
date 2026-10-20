import Fastify, { type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from '@fastify/type-provider-zod';
import { randomUUID } from 'node:crypto';
import { AppError } from './schemas/errors.js';
import type { Env } from './schemas/env.js';
import { BearService } from './services/bear-service.js';
import { bearRoutes } from './routes/bears.js';

export function buildApp(env: Env): FastifyInstance {
  const app = Fastify({
    logger: true,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });
  // For route schemas since they are expected to be JSON but in our case they are zod
  // setValidator for inout -> builds validtor function from each routes params
  // setSerializer for putput -> builds validator function from the response schemas
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Minimal mapping: Task 4 turns this into application/problem+json
  app.setErrorHandler((err, req, reply) => {
    if (!(err instanceof AppError)) throw err; // Fastify's default handler
    if (err.status >= 500) req.log.error({ err }, 'request failed');
    return reply
      .code(err.status)
      .send({ type: err.type, title: err.title, status: err.status });
  });

  app.get('/health', async () => ({
    status: 'ok',
    version: process.env.APP_VERSION ?? 'dev',
    uptime: Math.round(process.uptime()),
  }));

  // void is used here because register returns a promise but we don't need to await it,
  // we just want to register the routes
  void app.register(bearRoutes, { bears: new BearService(env, app.log) });

  return app;
}
