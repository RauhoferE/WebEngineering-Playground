import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { Bear, BearId, BearList } from '../schemas/bear.js';
import type { BearService } from '../services/bear-service.js';
import { problemResponse } from '../schemas/problem.js';

export const bearRoutes: FastifyPluginAsyncZod<{ bears: BearService }> = async (
  app,
  { bears }
) => {
  app.get(
    '/api/bears',
    {
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
      schema: {
        params: z.object({ id: BearId }),
        response: { 200: Bear, ...problemResponse },
      },
    },
    async (req) => await bears.get(req.params.id)
  );
};
