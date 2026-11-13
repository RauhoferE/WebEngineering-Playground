import { type Comment, type NewComment } from '../schemas/comment.js';
import { NotFoundError } from '../schemas/errors.js';
import type { BearService } from './bear-service.js';
import type { CommentRepository } from '../repositories/comment-repository.js';

export class CommentService {
  constructor(
    private readonly comments: CommentRepository,
    private readonly bears: BearService
  ) {}

  async list(bearId: string): Promise<Comment[]> {
    await this.bears.get(bearId);
    return await this.comments.listByBear(bearId);
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
