import type { Comment, NewComment } from '../schemas/comment.js';
import type { CursorKey } from '../schemas/cursor.js';

export interface PageRequest {
  limit: number;
  after: CursorKey | null;
}

export interface PageResult {
  items: Comment[];
  hasMore: boolean;
}

export interface CommentRepository {
  listByBear: (bearId: string, page: PageRequest) => Promise<PageResult>;
  listByBears: (bearIds: string[]) => Promise<Map<string, Comment[]>>;
  create: (bearId: string, input: NewComment) => Promise<Comment>;
  delete: (id: string) => Promise<boolean>;
}
