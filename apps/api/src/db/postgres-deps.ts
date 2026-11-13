import type { FastifyBaseLogger } from 'fastify';
import type { AppDeps } from '../app.js';
import type { Env } from '../schemas/env.js';
import { createDb } from './client.js';
import { createPool } from './pool.js';
import { DrizzleBearRepository } from '../repositories/drizlle/bear-repository.js';
import { DrizzleCommentRepository } from '../repositories/drizlle/comment-repository.js';

export function createPostgresDeps(env: Env, log: FastifyBaseLogger): AppDeps {
  // Create connection pool
  const pool = createPool(env, log);
  // Assign db to connection pool
  const db = createDb(pool);
  // return correct implementation of repositories
  return {
    repos: {
      bears: new DrizzleBearRepository(db),
      comments: new DrizzleCommentRepository(db),
    },
    ping: async () => {
      await pool.query('SELECT 1');
    },
    close: async () => {
      await pool.end();
    },
  };
}
