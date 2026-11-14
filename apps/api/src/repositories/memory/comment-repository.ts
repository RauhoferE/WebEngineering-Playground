import { randomUUID } from 'crypto';
import type { Comment, NewComment } from '../../schemas/comment.js';
import type {
  CommentRepository,
  PageRequest,
  PageResult,
} from '../comment-repository.js';

export class MemoryCommentRepository implements CommentRepository {
  private readonly comments = new Map<string, Comment>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  async listByBear(
    bearId: string,
    { limit, after }: PageRequest
  ): Promise<PageResult> {
    // Same < as isBefore, so sorting and the cursor filter agree; ids are unique
    const newestFirst = (a: Comment, b: Comment): number => {
      if (a.createdAt !== b.createdAt)
        return a.createdAt < b.createdAt ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    };
    const isBefore = (c: Comment): boolean =>
      after === null ||
      c.createdAt < after.createdAt ||
      (c.createdAt === after.createdAt && c.id < after.id);

    const rows = [...this.comments.values()]
      .filter((c) => c.bearId === bearId && isBefore(c))
      .sort(newestFirst)
      .slice(0, limit + 1);
    return { items: rows.slice(0, limit), hasMore: rows.length > limit };
  }

  async listByBears(bearIds: string[]): Promise<Map<string, Comment[]>> {
    const grouped = new Map<string, Comment[]>(bearIds.map((id) => [id, []]));
    for (const c of this.comments.values()) grouped.get(c.bearId)?.push(c);
    return grouped;
  }

  async create(bearId: string, input: NewComment): Promise<Comment> {
    const comment: Comment = {
      id: randomUUID(),
      bearId,
      ...input,
      createdAt: this.now().toISOString(),
      reportCount: 0,
      hiddenAt: null,
    };
    this.comments.set(comment.id, comment);
    return comment;
  }

  async delete(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }
}
