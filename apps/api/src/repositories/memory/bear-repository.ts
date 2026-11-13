import type { Bear } from '../../schemas/bear.js';
import type { BearRepository } from '../bear-repository.js';

export class MemoryBearRepository implements BearRepository {
  constructor(private readonly bears: Bear[]) {}

  async list(): Promise<Bear[]> {
    return [...this.bears];
  }

  async findById(id: string): Promise<Bear | null> {
    return this.bears.find((b) => b.id === id) ?? null;
  }
}
