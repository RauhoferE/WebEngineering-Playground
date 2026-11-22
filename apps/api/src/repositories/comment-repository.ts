import type { Actor } from '../auth/policy.js';
import type { Comment } from '../schemas/comment.js';
import type { CursorKey } from '../schemas/cursor.js';

export interface PageRequest {
  limit: number;
  after: CursorKey | null;
}

export interface PageResult {
  items: Comment[];
  hasMore: boolean;
}

export interface ReportState {
  reportCount: number;
  hiddenAt: string | null;
}

export interface CommentRepository {
  listByBear: (bearId: string, page: PageRequest) => Promise<PageResult>;
  listByBears: (bearIds: string[]) => Promise<Map<string, Comment[]>>;
  create: (bearId: string, draft: CommentDraft) => Promise<Comment>;
  delete: (id: string, actor: Actor) => Promise<boolean>;
  findById: (id: string, opts?: { lock?: boolean }) => Promise<Comment | null>;
  updateReportState: (id: string, state: ReportState) => Promise<Comment>;
}

export interface CommentDraft {
  text: string;
  author: string;
  authorId: string | null; // null: seeded or legacy rows without an author
}
