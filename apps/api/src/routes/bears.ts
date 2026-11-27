import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { Bear, BearId, BearList } from '../schemas/bear.js';
import type { BearService } from '../services/bear-service.js';
import { problemResponse } from '../schemas/problem.js';
import { currentUser, type RequireAuth } from '../plugins/auth.js';
import { can, enforce } from '../auth/policy.js';

export const bearRoutes: FastifyPluginAsyncZod<{
  bears: BearService;
  requireAuth: RequireAuth;
}> = async (app, { bears, requireAuth }) => {
  app.get(
    '/api/bears',
    {
      config: { cache: 'public' },
      schema: {
        querystring: z.object({
          q: z
            .string()
            .trim()
            .max(50)
            .optional()
            .transform((v) => (v === '' ? undefined : v)),
        }),
        response: { 200: BearList, ...problemResponse },
      },
    },
    async (req) => ({ items: await bears.list(req.query) })
  );

  app.get(
    '/api/bears/:id',
    {
      config: { cache: 'public' },
      schema: {
        params: z.object({ id: BearId }),
        response: { 200: Bear, ...problemResponse },
      },
    },
    async (req) => await bears.get(req.params.id)
  );

  app.post(
    '/api/bears/refresh',
    {
      preHandler: requireAuth,
      schema: {
        response: {
          200: z.object({ count: z.number().int() }),
          401: Problem,
          403: Problem,
          ...problemResponse,
        },
      },
    },
    async (req) => {
      enforce(
        can(currentUser(req), 'bears:refresh'),
        'Only moderators may refresh the bears.'
      );
      return { count: await bears.refresh() };
    }
  );
};
