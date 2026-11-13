import { asc, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { bears } from '../db/schema.js';
import { type Bear } from '../schemas/bear.js';
import { NotFoundError } from '../schemas/errors.js';

export class BearService {
  constructor(private readonly db: Db) {}

  async list(): Promise<Bear[]> {
    const rows = await this.db
      .select()
      .from(bears)
      .orderBy(asc(bears.position));
    return rows.map(toBear);
  }

  async get(id: string): Promise<Bear> {
    const [row] = await this.db
      .select()
      .from(bears)
      .where(eq(bears.id, id))
      .limit(1);
    if (row === undefined) throw new NotFoundError(`No bear with id "${id}"`);
    return toBear(row);
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
