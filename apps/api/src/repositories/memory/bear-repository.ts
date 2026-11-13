import type { Bear } from '../../schemas/bear.js';
import type { BearRepository } from '../bear-repository.js';

export class MemoryBearRepository implements BearRepository {
  constructor(private readonly bears: Bear[]) {}

  async list({ q }: { q?: string }): Promise<Bear[]> {
    return this.bears.filter(
      (b) => q === undefined || b.name.toLowerCase().includes(q.toLowerCase())
    );
  }

  async findById(id: string): Promise<Bear | null> {
    return this.bears.find((b) => b.id === id) ?? null;
  }
}
