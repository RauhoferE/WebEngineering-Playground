import pg from 'pg';
import type { FastifyBaseLogger } from 'fastify';
import type { Env } from '../schemas/env.js';

// Sets rules for connection pool
// Pool = Set of open db connections to be reused
export function createPool(env: Env, log: FastifyBaseLogger): pg.Pool {
  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 2_000,
  });
  // Without a listener, an idle client dying (e.g. db restart) crashes the process
  pool.on('error', (err) => {
    log.error({ err }, 'idle database client failed');
  });
  return pool;
}
