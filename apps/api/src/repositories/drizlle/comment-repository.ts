import { asc, eq, inArray } from 'drizzle-orm';
import type { CommentRepository } from '../comment-repository.js';
import type { Comment, NewComment } from '../../schemas/comment.js';
import type { Db } from '../../db/client.js';
import { comments } from '../../db/schema.js';

export class DrizzleCommentRepository implements CommentRepository {
  constructor(private readonly db: Db) {}

  async listByBear(bearId: string): Promise<Comment[]> {
    const rows = await this.db
      .select()
      .from(comments)
      .where(eq(comments.bearId, bearId))
      .orderBy(asc(comments.createdAt), asc(comments.id));
    return rows.map(toComment);
  }

  async listByBears(bearIds: string[]): Promise<Map<string, Comment[]>> {
    const grouped = new Map<string, Comment[]>(bearIds.map((id) => [id, []]));
    if (bearIds.length === 0) return grouped;
    const rows = await this.db
      .select()
      .from(comments)
      .where(inArray(comments.bearId, bearIds))
      .orderBy(asc(comments.createdAt), asc(comments.id));
    for (const row of rows) grouped.get(row.bearId)?.push(toComment(row));
    return grouped;
  }

  async create(bearId: string, input: NewComment): Promise<Comment> {
    const [row] = await this.db
      .insert(comments)
      .values({ bearId, ...input })
      .returning();
    if (row === undefined) throw new Error('insert returned no row');
    return toComment(row);
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(comments)
      .where(eq(comments.id, id))
      .returning({ id: comments.id });
    return deleted.length > 0;
  }
}

function toComment(row: typeof comments.$inferSelect): Comment {
  return {
    id: row.id,
    bearId: row.bearId,
    author: row.author,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  };
}
