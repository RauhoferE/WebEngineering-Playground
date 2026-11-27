import { LRUCache } from 'lru-cache';
import { cacheLoads, cacheLookups } from '../plugins/metrics.js';

type Loader<V> = () => Promise<V>;

export interface Cache<V> {
  get: (key: string, load: Loader<V>) => Promise<V>;
}

// lru-cache handles TTL, max size and coalescing: fetch() for a key that is already
// loading returns the same promise. A failed load stores nothing; every waiter gets the error.
// The service passes the loader on each call, so it still owns the logic (cache-aside).
export function createCache<V extends NonNullable<unknown>>(
  name: string,
  options: { max: number; ttl: number }
): Cache<V> {
  const lru = new LRUCache<string, V, Loader<V>>({
    ...options,
    fetchMethod: async (_key, _stale, { context: load }) => {
      cacheLoads.inc({ cache: name });
      return await load();
    },
  });
  return {
    async get(key, load) {
      const status: LRUCache.Status<string, V, Loader<V>> = {};
      const value = await lru.fetch(key, { context: load, status });
      cacheLookups.inc({ cache: name, result: status.fetch ?? 'unknown' });
      if (value === undefined)
        throw new Error(`cache ${name}: loader returned nothing`);
      return value;
    },
  };
}
