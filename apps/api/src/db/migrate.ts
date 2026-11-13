import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import type { Db } from './client.js';

// Resolves to apps/api/drizzle from both src/db and dist/db
const migrationsFolder = fileURLToPath(
  new URL('../../drizzle', import.meta.url)
);

export async function runMigrations(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder });
}
