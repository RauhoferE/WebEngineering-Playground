import { randomUUID } from 'node:crypto';
import { type Comment, type NewComment } from '../schemas/comment.js';
import { NotFoundError } from '../schemas/errors.js';
import type { BearService } from './bear-service.js';

export class CommentService {
  // Lives in the API process memory: survives a page reload, not a restart
  private readonly comments = new Map<string, Comment>();

  constructor(private readonly bears: BearService) {}

  async list(bearId: string): Promise<Comment[]> {
    await this.bears.get(bearId); // 404 for unknown bears
    return [...this.comments.values()].filter((c) => c.bearId === bearId);
  }

  async create(bearId: string, input: NewComment): Promise<Comment> {
    await this.bears.get(bearId); // 404 for unknown bears
    const comment: Comment = {
      id: randomUUID(),
      bearId,
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.comments.set(comment.id, comment);
    return comment;
  }

  delete(id: string): void {
    if (!this.comments.delete(id)) {
      throw new NotFoundError(`No comment with id "${id}"`);
    }
  }
}
