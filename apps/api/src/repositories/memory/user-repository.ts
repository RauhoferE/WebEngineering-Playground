import { randomUUID } from 'crypto';
import type { NewUser, User, UserRepository } from '../user-repository.js';

export class MemoryUserRepository implements UserRepository {
  // email to user map
  private readonly users = new Map<string, User>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  async findById(id: string): Promise<User | null> {
    return [...this.users.values()].find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.get(email) ?? null;
  }

  async create(input: NewUser): Promise<User | null> {
    if (this.users.has(input.email)) {
      return null;
    }

    this.users.set(input.email, {
      id: randomUUID(),
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: this.now().toISOString(),
    });
    return await this.findByEmail(input.email);
  }
}
