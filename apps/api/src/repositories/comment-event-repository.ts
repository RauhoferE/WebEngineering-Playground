import type { Comment } from '../schemas/comment.js';

// What a writer hands in: the type decides the shape of data
export type CommentEventInput =
  | { type: 'comment.created'; data: Comment }
  | { type: 'comment.deleted'; data: { id: string } };

// What comes back: the stored event with its per-bear position
export type CommentEvent = CommentEventInput & { bearId: string; seq: number };

export type CommentEventType = CommentEvent['type'];

export interface CommentEventRepository {
  // Call only inside uow.run: the counter bump and the insert must commit together with the comment write
  append: (bearId: string, event: CommentEventInput) => Promise<CommentEvent>;
  // Events after afterSeq, oldest first: the catch-up for a reconnecting client
  since: (bearId: string, afterSeq: number) => Promise<CommentEvent[]>;
  // The newest seq of this bear; 0 if nothing has happened yet
  currentSeq: (bearId: string) => Promise<number>;
}
