import { and, eq } from 'drizzle-orm';
import type { Executor } from '../../db/client.js';
import { idempotencyKeys } from '../../db/schema.js';
import type { Comment } from '../../schemas/comment.js';
import type {
  IdempotencyKeyRepository,
  SavedResponse,
} from '../idempotency-key-repository.js';

export class DrizzleIdempotencyKeyRepository implements IdempotencyKeyRepository {
  constructor(private readonly db: Executor) {}

  async claim(
    userId: string,
    key: string,
    fingerprint: string
  ): Promise<boolean> {
    const inserted = await this.db
      .insert(idempotencyKeys)
      .values({ userId, key, fingerprint })
      .onConflictDoNothing()
      .returning({ key: idempotencyKeys.key });
    return inserted.length > 0;
  }

  async find(userId: string, key: string): Promise<SavedResponse | null> {
    const [row] = await this.db
      .select({
        fingerprint: idempotencyKeys.fingerprint,
        response: idempotencyKeys.response,
      })
      .from(idempotencyKeys)
      .where(
        and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, key))
      );
    return row ?? null;
  }

  async saveResponse(
    userId: string,
    key: string,
    response: Comment
  ): Promise<void> {
    await this.db
      .update(idempotencyKeys)
      .set({ response })
      .where(
        and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, key))
      );
  }
}
