import type { RevokedTokenRepository } from '../repositories/revoke-token-repository.js';
import type { User, UserRepository } from '../repositories/user-repository.js';
import type { PublicUser, RegisterBody, LoginBody } from '../schemas/auth.js';
import { EmailTakenError, UnauthorizedError } from '../schemas/errors.js';
import { dummyHash, hashPassword, verifyPassword } from './password.js';
import type { TokenService } from './token-service.js';

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly revoked: RevokedTokenRepository,
    private readonly tokens: TokenService
  ) {}

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

  async login(input: LoginBody): Promise<{ user: PublicUser; token: string }> {
    const user = await this.users.findByEmail(input.email);
    // Same work and same 401 whether the e-mail exists or not (no enumeration)
    const ok = await verifyPassword(
      user?.passwordHash ?? (await dummyHash()),
      input.password
    );
    if (user === null || !ok)
      throw new UnauthorizedError('Invalid e-mail or password.');
    return { user: toPublic(user), token: await this.tokens.issue(user.id) };
  }

  // Authentication only: who is this? null = nobody
  async authenticate(token: string | undefined): Promise<User | null> {
    if (token === undefined) return null;
    const claims = await this.tokens.verify(token);
    if (claims === null || (await this.revoked.isRevoked(claims.jti)))
      return null;
    return await this.users.findById(claims.userId); // fresh role; deleted users are out
  }

  async logout(token: string | undefined): Promise<void> {
    if (token === undefined) return;
    const claims = await this.tokens.verify(token);
    if (claims !== null)
      await this.revoked.revoke(claims.jti, claims.expiresAt);
  }
}

export function toPublic(u: User): PublicUser {
  return { id: u.id, email: u.email, role: u.role, createdAt: u.createdAt };
}
