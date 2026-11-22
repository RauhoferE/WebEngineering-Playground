import type { User, UserRepository } from '../repositories/user-repository.js';
import type { PublicUser, RegisterBody } from '../schemas/auth.js';
import { EmailTakenError } from '../schemas/errors.js';
import { hashPassword } from './password.js';

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(input: RegisterBody): Promise<PublicUser> {
    const passwordHash = await hashPassword(input.password);
    const user = await this.users.create({
      email: input.email,
      passwordHash,
      role: 'user',
    });
    if (user === null) throw new EmailTakenError();
    return toPublic(user);
  }
}

export function toPublic(u: User): PublicUser {
  return { id: u.id, email: u.email, role: u.role, createdAt: u.createdAt };
}
