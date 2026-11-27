import type { Comment } from '../../schemas/comment.js';
import type {
  IdempotencyKeyRepository,
  SavedResponse,
} from '../idempotency-key-repository.js';

export class MemoryIdempotencyKeyRepository implements IdempotencyKeyRepository {
  private readonly saved = new Map<string, SavedResponse>();

  async claim(
    userId: string,
    key: string,
    fingerprint: string
  ): Promise<boolean> {
    const id = `${userId}:${key}`;
    if (this.saved.has(id)) return false;
    this.saved.set(id, { fingerprint, response: null });
    return true;
  }

  async find(userId: string, key: string): Promise<SavedResponse | null> {
    return this.saved.get(`${userId}:${key}`) ?? null;
  }

  async saveResponse(
    userId: string,
    key: string,
    response: Comment
  ): Promise<void> {
    const entry = this.saved.get(`${userId}:${key}`);
    if (entry !== undefined) entry.response = response;
  }
}
