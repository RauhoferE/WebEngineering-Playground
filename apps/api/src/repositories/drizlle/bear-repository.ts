import { asc, eq, ilike } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { bears } from '../../db/schema.js';
import { type Bear } from '../../schemas/bear.js';
import type { BearRepository } from '../bear-repository.js';

// % and _ in user input are wildcards; escape them so "a_b" means a literal "a_b"
const escapeLike = (s: string): string => s.replace(/[\\%_]/g, '\\$&');

export class DrizzleBearRepository implements BearRepository {
  constructor(private readonly db: Db) {}

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
