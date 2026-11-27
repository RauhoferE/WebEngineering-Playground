import pg from 'pg';
import { createDb } from '../db/client.js';
import { loadEnv } from '../schemas/env.js';
import { fetchBearsFromWikipedia } from '../services/bear-source.js';
import { DrizzleBearRepository } from '../repositories/drizlle/bear-repository.js';

const env = loadEnv();
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
try {
  const fetched = await fetchBearsFromWikipedia(env, console);
  await new DrizzleBearRepository(createDb(pool)).upsertMany(fetched); // also sends NOTIFY
  console.log(`seeded ${fetched.length} bears`);
} finally {
  await pool.end();
}
