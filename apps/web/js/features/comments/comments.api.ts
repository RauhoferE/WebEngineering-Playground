import { apiBase } from '../../common/config';
import { toApiError } from '../../common/problem';
import { type CommentPage, type CommentEntry } from './comment-models';

export async function fetchComments(
  bearId: string,
  cursor: string | null,
  signal?: AbortSignal
): Promise<CommentPage> {
  const params = new URLSearchParams({ limit: '10' });
  if (cursor !== null) params.set('cursor', cursor);
  const res = await fetch(
    `${apiBase}/api/bears/${encodeURIComponent(bearId)}/comments?${params.toString()}`,
    {
      signal,
      headers: { Accept: 'application/json' },
    }
  );
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as CommentPage;
}

export async function createComment(
  bearId: string,
  comment: { author: string; text: string }
): Promise<CommentEntry> {
  const res = await fetch(
    `${apiBase}/api/bears/${encodeURIComponent(bearId)}/comments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(comment),
    }
  );
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as CommentEntry;
}
