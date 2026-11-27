import {
  type CommentPage,
  type Comment,
  type NewComment,
} from '../schemas/comment.js';
import { InvalidCursorError, NotFoundError } from '../schemas/errors.js';
import type { BearService } from './bear-service.js';
import type { CommentRepository } from '../repositories/comment-repository.js';
import { decodeCursor, encodeCursor } from '../schemas/cursor.js';
import type { UnitOfWork } from '../repositories/unit-of-work.js';
import { type User } from '../repositories/user-repository.js';
import { type Actor, can, enforce } from '../auth/policy.js';
import {
  type CommentEvent,
  type CommentEventRepository,
} from '../repositories/comment-event-repository.js';
import { type CommentBus } from '../events/comment-bus.js';

export type ReportMode = 'naive' | 'transaction' | 'locked';

export class CommentService {
  constructor(
    private readonly comments: CommentRepository,
    private readonly bears: BearService,
    private readonly uow: UnitOfWork,
    private readonly reportMode: ReportMode,
    private readonly events: CommentEventRepository,
    private readonly bus: CommentBus
  ) {}

  async get(id: string): Promise<Comment> {
    const comment = await this.comments.findById(id);
    if (comment === null) throw new NotFoundError(`No comment with id "${id}"`);
    return comment;
  }

  async report(id: string): Promise<Comment> {
    if (this.reportMode === 'naive') {
      return await reportOnce(this.comments, id, false);
    }
    // One transaction: BEGIN ... COMMIT; rolled back if anything throws
    return await this.uow.run(
      async ({ comments }) =>
        await reportOnce(comments, id, this.reportMode === 'locked')
    );
  }

  async list(
    bearId: string,
    query: { limit: number; cursor?: string }
  ): Promise<CommentPage> {
    await this.bears.get(bearId);
    const after =
      query.cursor === undefined ? null : decodeCursor(query.cursor);
    if (after === null && query.cursor !== undefined)
      throw new InvalidCursorError('bad cursor');

    const { items, hasMore } = await this.comments.listByBear(bearId, {
      limit: query.limit,
      after,
    });
    const last = items.at(-1);
    return {
      items,
      nextCursor: hasMore && last !== undefined ? encodeCursor(last) : null,
    };
  }

  async create(
    bearId: string,
    input: NewComment,
    user: User
  ): Promise<Comment> {
    enforce(can(user, 'comment:create'));
    await this.bears.get(bearId); // 404 for unknown bears
    const { comment, event } = await this.uow.run(
      async ({ comments, commentEvents }) => {
        const comment = await comments.create(bearId, {
          text: input.text,
          author: displayName(user),
          authorId: user.id,
        });
        const event = await commentEvents.append(bearId, {
          type: 'comment.created',
          data: comment,
        });
        return { comment, event };
      }
    );
    this.bus.publish(event); // only after COMMIT: never push a rolled-back comment
    return comment;
  }

  async delete(id: string, actor: Actor): Promise<void> {
    const comment = await this.comments.findById(id);
    if (comment === null) throw new NotFoundError(`No comment with id "${id}"`);
    enforce(can(actor, 'comment:delete', comment)); // 403: not yours
    const event = await this.uow.run(async ({ comments, commentEvents }) => {
      if (!(await comments.delete(id, actor))) {
        throw new NotFoundError(`No comment with id "${id}"`);
      }
      return await commentEvents.append(comment.bearId, {
        type: 'comment.deleted',
        data: { id },
      });
    });
    this.bus.publish(event);
  }

  // 404 for unknown bears; the stream route calls it before any SSE header is sent
  async assertBear(bearId: string): Promise<void> {
    await this.bears.get(bearId);
  }

  // Catch-up for a reconnecting client
  async eventsSince(bearId: string, afterSeq: number): Promise<CommentEvent[]> {
    return await this.events.since(bearId, afterSeq);
  }

  async currentSeq(bearId: string): Promise<number> {
    return await this.events.currentSeq(bearId);
  }
}

async function reportOnce(
  comments: CommentRepository,
  id: string,
  lock: boolean
): Promise<Comment> {
  const current = await comments.findById(id, { lock });
  if (current === null) throw new NotFoundError(`No comment with id "${id}"`);
  const reportCount = current.reportCount + 1;
  const hiddenAt =
    reportCount >= 3 && current.hiddenAt === null
      ? new Date().toISOString()
      : current.hiddenAt;
  return await comments.updateReportState(id, { reportCount, hiddenAt });
}

// Helper to get username
function displayName(user: User): string {
  return user.email.split('@')[0] ?? 'user';
}
