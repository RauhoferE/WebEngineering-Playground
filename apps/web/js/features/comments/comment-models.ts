export interface CommentEntry {
  id: string;
  bearId: string;
  author: string;
  authorId: string | null;
  createdAt: string;
  text: string;
}

export interface CommentPage {
  items: CommentEntry[];
  nextCursor: string | null;
}
