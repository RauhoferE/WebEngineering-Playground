import type { FastifyRequest } from 'fastify';
import type {} from '@fastify/cookie';
import type { User } from '../repositories/user-repository.js';
import type { AuthService } from '../services/auth-service.js';
import { UnauthorizedError } from '../schemas/errors.js';

export const TOKEN_COOKIE = 'token';

declare module 'fastify' {
  interface FastifyRequest {
    user: User | null;
  }
}

export type RequireAuth = (req: FastifyRequest) => Promise<void>;

export function createRequireAuth(auth: AuthService): RequireAuth {
  return async (req) => {
    const user = await auth.authenticate(req.cookies[TOKEN_COOKIE]);
    if (user === null) throw new UnauthorizedError();
    req.user = user;
  };
}

export function currentUser(req: FastifyRequest): User {
  if (req.user === null) throw new UnauthorizedError();
  return req.user;
}
