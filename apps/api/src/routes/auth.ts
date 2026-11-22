import { type FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { type AuthService } from '../services/auth-service.js';
import { PublicUser, RegisterBody } from '../schemas/auth.js';
import { Problem, problemResponse } from '../schemas/problem.js';

export const authRoutes: FastifyPluginAsyncZod<{ auth: AuthService }> = async (
  app,
  { auth }
) => {
  app.post(
    '/api/auth/register',
    {
      schema: {
        body: RegisterBody,
        response: { 201: PublicUser, 409: Problem, ...problemResponse },
      },
    },
    async (req, reply) =>
      await reply.code(201).send(await auth.register(req.body))
  );
};
