import {
  type CommentPage,
  type Comment,
  type NewComment,
} from '../schemas/comment.js';
import { InvalidCursorError, NotFoundError } from '../schemas/errors.js';
import type { BearService } from './bear-service.js';
import type { CommentRepository } from '../repositories/comment-repository.js';
import { decodeCursor, encodeCursor } from '../schemas/cursor.js';

export class CommentService {
  constructor(
    private readonly comments: CommentRepository,
    private readonly bears: BearService
  ) {}

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
