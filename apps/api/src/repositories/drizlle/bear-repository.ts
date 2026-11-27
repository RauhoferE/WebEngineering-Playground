import { asc, eq, ilike, sql } from 'drizzle-orm';
import type { Executor } from '../../db/client.js';
import { bears } from '../../db/schema.js';
import { type Bear } from '../../schemas/bear.js';
import type { BearRepository } from '../bear-repository.js';
import { BEARS_CHANGED } from '../../db/bears-changed.js';

// % and _ in user input are wildcards; escape them so "a_b" means a literal "a_b"
const escapeLike = (s: string): string => s.replace(/[\\%_]/g, '\\$&');

export class DrizzleBearRepository implements BearRepository {
  constructor(private readonly db: Executor) {}

  async list({ q }: { q?: string }): Promise<Bear[]> {
    const rows = await this.db
      .select()
      .from(bears)
      .where(
        q === undefined ? undefined : ilike(bears.name, `%${escapeLike(q)}%`)
      )
      .orderBy(asc(bears.position));
    return rows.map(toBear);
  }

  async findById(id: string): Promise<Bear | null> {
    const [row] = await this.db
      .select()
      .from(bears)
      .where(eq(bears.id, id))
      .limit(1);
    return row === undefined ? null : toBear(row);
  }

  async upsertMany(list: Bear[]): Promise<void> {
    await this.db
      .insert(bears)
      .values(list.map((b, position) => ({ ...b, position })))
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
    // Inside a transaction this is delivered on commit
    await this.db.execute(sql`SELECT pg_notify(${BEARS_CHANGED}, '')`);
  }
}

function toBear(row: typeof bears.$inferSelect): Bear {
  return {
    id: row.id,
    name: row.name,
    binomial: row.binomial,
    imageUrl: row.imageUrl,
    range: row.range,
  };
}
