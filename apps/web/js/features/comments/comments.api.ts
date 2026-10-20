import { toApiError } from '../../common/problem';
import { type CommentEntry } from './comment-models';

export async function fetchComments(
  bearId: string,
  signal: AbortSignal
): Promise<CommentEntry[]> {
  const res = await fetch(`/api/bears/${encodeURIComponent(bearId)}/comments`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw await toApiError(res);
  const body = (await res.json()) as { items: CommentEntry[] };
  return body.items;
}

export async function createComment(
  bearId: string,
  comment: { author: string; text: string }
): Promise<CommentEntry> {
  const res = await fetch(`/api/bears/${encodeURIComponent(bearId)}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(comment),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as CommentEntry;
}
