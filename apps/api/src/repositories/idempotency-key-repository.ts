import type { Comment } from '../schemas/comment.js';

export interface SavedResponse {
  fingerprint: string;
  response: Comment | null;
}

export interface IdempotencyKeyRepository {
  // true: the key is new. false: it exists. A concurrent twin blocks here until the first transaction commits
  claim: (userId: string, key: string, fingerprint: string) => Promise<boolean>;
  find: (userId: string, key: string) => Promise<SavedResponse | null>;
  saveResponse: (
    userId: string,
    key: string,
    response: Comment
  ) => Promise<void>;
}
