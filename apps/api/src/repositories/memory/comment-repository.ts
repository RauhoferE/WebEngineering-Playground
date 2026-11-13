import { randomUUID } from 'crypto';
import type { Comment, NewComment } from '../../schemas/comment.js';
import type { CommentRepository } from '../comment-repository.js';

export class MemoryCommentRepository implements CommentRepository {
  private readonly comments = new Map<string, Comment>();

  async listByBear(bearId: string): Promise<Comment[]> {
    return [...this.comments.values()].filter((c) => c.bearId === bearId);
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
      createdAt: new Date().toISOString(),
    };
    this.comments.set(comment.id, comment);
    return comment;
  }

  async delete(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }
}
