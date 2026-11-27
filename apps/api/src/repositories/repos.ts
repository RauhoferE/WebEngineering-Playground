import { type BearRepository } from './bear-repository.js';
import { type CommentEventRepository } from './comment-event-repository.js';
import { type CommentRepository } from './comment-repository.js';
import { type IdempotencyKeyRepository } from './idempotency-key-repository.js';
import { type RevokedTokenRepository } from './revoke-token-repository.js';
import { type UserRepository } from './user-repository.js';

export interface Repos {
  bears: BearRepository;
  comments: CommentRepository;
  users: UserRepository;
  revokedTokens: RevokedTokenRepository;
  commentEvents: CommentEventRepository;
  idempotencyKeys: IdempotencyKeyRepository;
}
