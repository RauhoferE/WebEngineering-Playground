import type { FastifyInstance } from 'fastify';
import { collectDefaultMetrics, Counter, register } from 'prom-client';

// Event loop lag, heap, GC; module scope means once per process
collectDefaultMetrics();

export const cacheLookups = new Counter({
  name: 'cache_lookups_total',
  help: 'Cache lookups by result: hit, miss, stale, inflight (joined a running load)',
  labelNames: ['cache', 'result'] as const,
});

export const cacheLoads = new Counter({
  name: 'cache_loads_total',
  help: 'Loads that actually reached the database or Wikipedia',
  labelNames: ['cache'] as const,
});

export function registerMetrics(app: FastifyInstance): void {
  app.get(
    '/metrics',
    async (_req, reply) =>
      await reply.type(register.contentType).send(await register.metrics())
  );
}
