import type { FastifyInstance } from 'fastify';

export const CACHE_CONTROL = {
  public: 'public, max-age=60, stale-while-revalidate=300',
  revalidate: 'private, no-cache',
  none: 'private, no-store',
} as const;

export type CachePolicy = Exclude<keyof typeof CACHE_CONTROL, 'none'>;

declare module 'fastify' {
  interface FastifyContextConfig {
    cache?: CachePolicy;
  }
}

export function registerHttpCache(app: FastifyInstance): void {
  app.addHook('onSend', async (req, reply, payload) => {
    if (reply.hasHeader('cache-control')) return payload; // SSE route in Task 3 sets its own
    const policy = req.routeOptions.config.cache;
    const isRead = req.method === 'GET' || req.method === 'HEAD';
    // 304 counts as success too, so the result doesn't depend on hook order with @fastify/etag
    const ok = reply.statusCode === 200 || reply.statusCode === 304;
    void reply.header(
      'cache-control',
      policy !== undefined && isRead && ok
        ? CACHE_CONTROL[policy]
        : CACHE_CONTROL.none
    );
    return payload;
  });
}
