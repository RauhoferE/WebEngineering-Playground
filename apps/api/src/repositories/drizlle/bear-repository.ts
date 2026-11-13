import { asc, eq } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { bears } from '../../db/schema.js';
import { type Bear } from '../../schemas/bear.js';
import type { BearRepository } from '../bear-repository.js';

export class DrizzleBearRepository implements BearRepository {
  constructor(private readonly db: Db) {}

  async list(): Promise<Bear[]> {
    const rows = await this.db
      .select()
      .from(bears)
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
