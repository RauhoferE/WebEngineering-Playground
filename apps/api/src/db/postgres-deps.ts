import type { FastifyBaseLogger } from 'fastify';
import type { AppDeps } from '../app.js';
import type { Env } from '../schemas/env.js';
import { createDb, type Executor } from './client.js';
import { createPool } from './pool.js';
import { DrizzleBearRepository } from '../repositories/drizlle/bear-repository.js';
import { DrizzleCommentRepository } from '../repositories/drizlle/comment-repository.js';
import type { Repos } from '../repositories/repos.js';
import type { UnitOfWork } from '../repositories/unit-of-work.js';
import { DrizzleUserRepository } from '../repositories/drizlle/user-repository.js';
import { DrizzleRevokeTokenRepository } from '../repositories/drizlle/revoke-token-repository.js';
import { listenForBearChanges } from './bears-changed.js';
import type pg from 'pg';

export function createPostgresDeps(env: Env, log: FastifyBaseLogger): AppDeps {
  // Create connection pool
  const pool = createPool(env, log);
  // Assign db to connection pool
  const db = createDb(pool);
  const repos = createRepos(db);
  const uow: UnitOfWork = {
    // db transaction issues BEGIN runs the callback then commmit
    // If callback throws it issues rollback and drizzle borrows one pooled connection for whole transaction
    // Every query must go through tx
    // A query through db would run on a different pooled connection outside the transaction
    // THats why reporitories handed to work are build from tx the service cannot use a wrong one
    run: async (work) =>
      await db.transaction(async (tx) => await work(createRepos(tx))),
  };

  let listener: pg.Client | undefined;
  // return correct implementation of repositories
  return {
    repos,
    uow,
    ping: async () => {
      await pool.query('SELECT 1');
    },
    onBearsChanged: (onChange) => {
      listener = listenForBearChanges(env.DATABASE_URL, onChange, log);
    },
    close: async () => {
      await listener?.end();
      await pool.end();
    },
  };
}

function createRepos(executor: Executor): Repos {
  return {
    bears: new DrizzleBearRepository(executor),
    comments: new DrizzleCommentRepository(executor),
    users: new DrizzleUserRepository(executor),
    revokedTokens: new DrizzleRevokeTokenRepository(executor),
  };
}
