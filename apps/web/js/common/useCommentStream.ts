import { useEffect, type Dispatch, type SetStateAction } from 'react';
import ReconnectingEventSource from 'reconnecting-eventsource';
import type { CommentEntry } from '../features/comments/comment-models';
import { apiBase } from './config';

// Keeps the list live; reconnects on its own, also after a 502 while the API restarts
export function useCommentStream(
  bearId: string,
  setComments: Dispatch<SetStateAction<CommentEntry[]>>
): void {
  useEffect(() => {
    const source = new ReconnectingEventSource(
      `${apiBase}/api/bears/${encodeURIComponent(bearId)}/comments/stream`,
      { max_retry_time: 3000 }
    );
    // No-op, but the wrapper only remembers ids of events that have a listener
    source.addEventListener('ready', () => undefined);
    source.addEventListener(
      'comment.created',
      (event: MessageEvent<string>) => {
        const created = JSON.parse(event.data) as CommentEntry;
        // The tab that posted already added it in handleCreate
        setComments((previous) =>
          previous.some((c) => c.id === created.id)
            ? previous
            : [created, ...previous]
        );
      }
    );
    source.addEventListener(
      'comment.deleted',
      (event: MessageEvent<string>) => {
        const { id } = JSON.parse(event.data) as { id: string };
        setComments((previous) => previous.filter((c) => c.id !== id));
      }
    );
    return () => {
      source.close();
    };
  }, [bearId, setComments]);
}
