import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { Bear, BearId, BearList } from '../schemas/bear.js';
import type { BearService } from '../services/bear-service.js';

export const bearRoutes: FastifyPluginAsyncZod<{ bears: BearService }> = async (
  app,
  { bears }
) => {
  app.get(
    '/api/bears',
    { schema: { response: { 200: BearList } } },
    async () => ({ items: await bears.list() })
  );

  app.get(
    '/api/bears/:id',
    {
      schema: {
        params: z.object({ id: BearId }),
        response: { 200: Bear },
      },
    },
    async (req) => await bears.get(req.params.id)
  );
};
