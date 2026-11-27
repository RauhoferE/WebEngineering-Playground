import { type Bear } from '../schemas/bear.js';
import { NotFoundError } from '../schemas/errors.js';
import type { BearRepository } from '../repositories/bear-repository.js';
import { createCache } from '../cache/cache.js';

export type BearSource = () => Promise<Bear[]>;

export class BearService {
  private generation = 1;
  // q is free text: max bounds memory, zod already bounds the length
  private readonly lists = createCache<Bear[]>('bears_list', {
    max: 500,
    ttl: 60_000,
  });

  // One entry for 10 min, so repeated refreshes don't hammer Wikipedia
  private readonly upstream = createCache<Bear[]>('wikipedia', {
    max: 1,
    ttl: 10 * 60_000,
  });

  constructor(
    private readonly bears: BearRepository,
    private readonly source: BearSource
  ) {}

  async list({ q }: { q: string | undefined }): Promise<Bear[]> {
    const key = `bears:list:g${this.generation}:q=${(q ?? '').toLowerCase()}`;
    return await this.lists.get(key, async () => await this.bears.list({ q }));
  }

  async get(id: string): Promise<Bear> {
    const bear = await this.bears.findById(id);
    if (bear === null) throw new NotFoundError(`No bear with id "${id}"`);
    return bear;
  }

  async refresh(): Promise<number> {
    const fresh = await this.upstream.get('wikipedia:bears', this.source);
    await this.bears.upsertMany(fresh);
    this.invalidate();
    return fresh.length;
  }

  invalidate(): void {
    this.generation++;
  }
}
