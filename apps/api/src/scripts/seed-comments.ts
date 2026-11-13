import { sql } from 'drizzle-orm';
import pg from 'pg';
import { createDb } from '../db/client.js';
import { loadEnv } from '../schemas/env.js';

const env = loadEnv();
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const db = createDb(pool);
try {
  await db.execute(sql`DELETE FROM comments WHERE author = 'Seed bot'`);
  await db.execute(sql`
    WITH ids AS (SELECT array_agg(id ORDER BY position) AS a FROM bears)
    INSERT INTO comments (bear_id, author, text, created_at)
    SELECT ids.a[1 + g % cardinality(ids.a)],
           'Seed bot',
           'Seeded comment #' || g,
           now() - make_interval(secs => g)
    FROM ids, generate_series(1, 100000) AS g
  `);
  await db.execute(sql`ANALYZE comments`);
  console.log('seeded 100000 comments');
} finally {
  await pool.end();
}
