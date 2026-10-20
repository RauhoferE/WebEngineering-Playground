import Fastify, { type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from '@fastify/type-provider-zod';
import { randomUUID } from 'node:crypto';
import { problem, toProblem } from './schemas/errors.js';
import type { Env } from './schemas/env.js';
import { BearService } from './services/bear-service.js';
import { bearRoutes } from './routes/bears.js';
import { commentRoutes } from './routes/comment.js';
import { CommentService } from './services/comment-service.js';
import cors from '@fastify/cors';

export function buildApp(env: Env): FastifyInstance {
  const app = Fastify({
    logger: true,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });
  // For route schemas since fastify expects them to be JSON but in our case they are zod
  // setValidator for inout -> builds validtor function from each routes params
  // setSerializer for putput -> builds validator function from the response schemas
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Set CORS
  void app.register(cors, {
    origin: env.CORS_ORIGINS, // allow-list, never "*" or reflecting every origin
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['content-type', 'x-request-id'],
    exposedHeaders: ['location', 'x-request-id'],
    credentials: false, // true in unit 3 (sessions)
    maxAge: 600, // browser may cache the preflight for 10 minutes
  });

  // Minimal mapping: Task 4 turns this into application/problem+json
  app.setErrorHandler((err, req, reply) => {
    const p = toProblem(err, req);
    if (p.status >= 500) {
      req.log.error({ err }, 'request failed');
    } else {
      req.log.info({ err }, 'request rejected');
    }
    return reply.code(p.status).type('application/problem+json').send(p);
  });

  app.setNotFoundHandler((req, reply) =>
    reply
      .code(404)
      .type('application/problem+json')
      .send(problem(404, 'No such route', req))
  );

  // Every response carries the request id (generated or taken from the client)
  // Done for error handling and possible logging
  app.addHook('onSend', (req, reply, payload, done) => {
    void reply.header('x-request-id', req.id);
    done(null, payload);
  });

  app.get('/health', async () => ({
    status: 'ok',
    version: process.env.APP_VERSION ?? 'dev',
    uptime: Math.round(process.uptime()),
  }));

  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug/error', async () => {
      throw new Error('provoked failure');
    });
  }

  // Assign bear service to const, so we can reuse it in the comment service, which needs to check if a bear exists before adding a comment
  const bears = new BearService(env, app.log);

  // void is used here because register returns a promise but we don't need to await it,
  // we just want to register the routes
  void app.register(bearRoutes, { bears });
  void app.register(commentRoutes, { comments: new CommentService(bears) });

  return app;
}
