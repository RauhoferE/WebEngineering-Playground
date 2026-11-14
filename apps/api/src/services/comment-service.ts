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

export type ReportMode = 'naive' | 'transaction' | 'locked';

export class CommentService {
  constructor(
    private readonly comments: CommentRepository,
    private readonly bears: BearService,
    private readonly uow: UnitOfWork,
    private readonly reportMode: ReportMode
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

  async create(bearId: string, input: NewComment): Promise<Comment> {
    await this.bears.get(bearId); // 404 for unknown bears
    return await this.comments.create(bearId, input);
  }

  async delete(id: string): Promise<void> {
    if (!(await this.comments.delete(id))) {
      throw new NotFoundError(`No comment with id "${id}"`);
    }
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
