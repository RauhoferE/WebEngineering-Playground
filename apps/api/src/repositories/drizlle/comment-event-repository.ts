import { and, asc, eq, gt, sql } from 'drizzle-orm';
import type {
  CommentEvent,
  CommentEventInput,
  CommentEventRepository,
} from '../comment-event-repository.js';
import type { Executor } from '../../db/client.js';
import type { Comment } from '../../schemas/comment.js';
import { bears, commentEvents } from '../../db/schema.js';

export class DrizzleCommentEventRepository implements CommentEventRepository {
  constructor(private readonly db: Executor) {}

  async append(
    bearId: string,
    event: CommentEventInput
  ): Promise<CommentEvent> {
    // UPDATE takes the row lock on this bear until COMMIT: writers of the same bear
    // queue here, so seq follows commit order. Writers of other bears don't wait
    const [counter] = await this.db
      .update(bears)
      .set({ eventSeq: sql`${bears.eventSeq} + 1` })
      .where(eq(bears.id, bearId))
      .returning({ seq: bears.eventSeq });
    if (counter === undefined) throw new Error(`bear ${bearId} vanished`);

    await this.db.insert(commentEvents).values({
      bearId,
      seq: counter.seq,
      type: event.type,
      payload: event.data,
    });
    return { ...event, bearId, seq: counter.seq };
  }

  async since(bearId: string, afterSeq: number): Promise<CommentEvent[]> {
    const rows = await this.db
      .select()
      .from(commentEvents)
      .where(
        and(eq(commentEvents.bearId, bearId), gt(commentEvents.seq, afterSeq))
      )
      .orderBy(asc(commentEvents.seq));
    return rows.map(toEvent);
  }

  async currentSeq(bearId: string): Promise<number> {
    const [row] = await this.db
      .select({ seq: bears.eventSeq })
      .from(bears)
      .where(eq(bears.id, bearId))
      .limit(1);
    return row?.seq ?? 0;
  }
}

// jsonb comes back as unknown; type and payload were written together by append
// Branching on type narrows the union, so only the payload needs an assertion
function toEvent(row: typeof commentEvents.$inferSelect): CommentEvent {
  const base = { bearId: row.bearId, seq: row.seq };
  return row.type === 'comment.created'
    ? { ...base, type: row.type, data: row.payload as Comment }
    : { ...base, type: row.type, data: row.payload as { id: string } };
}
