import pg from 'pg';
import { z } from 'zod';
import { createDb } from '../db/client.js';
import { users } from '../db/schema.js';
import { hashPassword } from '../services/password.js';

const env = z
  .object({
    DATABASE_URL: z.url(),
    MODERATOR_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
    MODERATOR_PASSWORD: z.string().min(12).max(128),
  })
  .parse(process.env);

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
try {
  const passwordHash = await hashPassword(env.MODERATOR_PASSWORD);
  await createDb(pool)
    .insert(users)
    .values({ email: env.MODERATOR_EMAIL, passwordHash, role: 'moderator' })
    .onConflictDoUpdate({
      target: users.email,
      set: { role: 'moderator', passwordHash },
    });
  console.log(`moderator ready: ${env.MODERATOR_EMAIL}`); // never log the password
} finally {
  await pool.end();
}
