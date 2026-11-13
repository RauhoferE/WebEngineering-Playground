import { type Bear } from '../schemas/bear.js';
import { NotFoundError } from '../schemas/errors.js';
import type { BearRepository } from '../repositories/bear-repository.js';

export class BearService {
  constructor(private readonly bears: BearRepository) {}

  async list(): Promise<Bear[]> {
    return await this.bears.list();
  }

  async get(id: string): Promise<Bear> {
    const bear = await this.bears.findById(id);
    if (bear === null) throw new NotFoundError(`No bear with id "${id}"`);
    return bear;
  }
}
