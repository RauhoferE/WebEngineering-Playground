import { sql } from 'drizzle-orm';
import pg from 'pg';
import { createDb } from '../db/client.js';
import { bears } from '../db/schema.js';
import { loadEnv } from '../schemas/env.js';
import { fetchBearsFromWikipedia } from '../services/bear-source.js';

const env = loadEnv();
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
try {
  const fetched = await fetchBearsFromWikipedia(env, console);
  await createDb(pool)
    .insert(bears)
    .values(fetched.map((b, position) => ({ ...b, position })))
    .onConflictDoUpdate({
      target: bears.id,
      set: {
        name: sql`excluded.name`,
        binomial: sql`excluded.binomial`,
        imageUrl: sql`excluded.image_url`,
        range: sql`excluded.range`,
        position: sql`excluded.position`,
        fetchedAt: sql`now()`,
      },
    });
  console.log(`seeded ${fetched.length} bears`);
} finally {
  await pool.end();
}
