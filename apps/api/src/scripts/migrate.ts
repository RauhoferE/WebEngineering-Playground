import pg from 'pg';
import { createDb } from '../db/client.js';
import { runMigrations } from '../db/migrate.js';
import { loadEnv } from '../schemas/env.js';

const env = loadEnv();
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
try {
  await runMigrations(createDb(pool));
  console.log('migrations applied');
} finally {
  await pool.end();
}
