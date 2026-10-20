import { z } from 'zod';
import { BearId } from './bear.js';

export const NewComment = z.object({
  author: z.string().trim().min(1).max(80),
  text: z.string().trim().min(1, 'text must not be empty').max(2000),
});
export type NewComment = z.infer<typeof NewComment>;

export const Comment = NewComment.extend({
  id: z.uuid(),
  bearId: BearId,
  createdAt: z.iso.datetime(),
});
export type Comment = z.infer<typeof Comment>;

// Same envelope as BearList
export const CommentList = z.object({ items: z.array(Comment) });
