import type { Bear } from '../schemas/bear.js';

export interface BearRepository {
  list: (filter: { q?: string }) => Promise<Bear[]>;
  findById: (id: string) => Promise<Bear | null>;
}
