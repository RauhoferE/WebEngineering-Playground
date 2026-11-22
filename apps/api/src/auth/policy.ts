import type { Role } from '../schemas/auth.js';
import { ForbiddenError, UnauthorizedError } from '../schemas/errors.js';

export interface Actor {
  id: string;
  role: Role;
}
export type Action = 'comment:create' | 'comment:delete';
export type Verdict = 'allow' | 'unauthenticated' | 'forbidden';
export interface CommentSubject {
  authorId: string | null;
}

// Pure: no Fastify, no database, so it can be tested on its own
export function can(
  actor: Actor | null,
  action: Action,
  subject?: CommentSubject
): Verdict {
  if (actor === null) return 'unauthenticated';
  switch (action) {
    case 'comment:create':
      return 'allow';
    case 'comment:delete':
      if (actor.role === 'moderator') return 'allow'; // RBAC
      // Ownership; a missing subject or an authorless comment is never "yours" (deny by default)
      return subject?.authorId === actor.id ? 'allow' : 'forbidden';
  }
}

export function enforce(verdict: Verdict): void {
  if (verdict === 'unauthenticated') throw new UnauthorizedError();
  if (verdict === 'forbidden')
    throw new ForbiddenError('You may not delete this comment.');
}
