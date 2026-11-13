import { useEffect, useState, type ReactElement } from 'react';
import { type CommentEntry } from './comment-models';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { createComment, fetchComments } from './comments.api';
import { ApiError } from '../../common/problem';

export function Comments({ bearId }: { bearId: string }): ReactElement {
  // The state for the visibility of the comments section
  const [visible, setVisible] = useState(false);
  // The loaded comments, newest first
  const [comments, setComments] = useState<CommentEntry[]>([]);
  // Opaque position after the last loaded comment; null when there are no older ones
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // First page; aborted if the component unmounts before the answer arrives
  useEffect(() => {
    const controller = new AbortController();
    fetchComments(bearId, null, controller.signal)
      .then((page) => {
        setComments(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? `Error: ${error.message}`
            : 'Error: Comments could not be loaded'
        );
      });
    return () => {
      controller.abort();
    };
  }, [bearId]);

  const loadMore = async (): Promise<void> => {
    if (nextCursor === null) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const page = await fetchComments(bearId, nextCursor);
      setComments((previous) => [...previous, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (error: unknown) {
      setLoadError(
        error instanceof ApiError
          ? `Error: ${error.message}`
          : 'Error: More comments could not be loaded'
      );
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="comments" aria-label="Comments">
      <button
        type="button"
        className="show-hide"
        aria-expanded={visible}
        aria-controls="comment-wrapper"
        onClick={() => {
          setVisible((previous) => !previous);
        }}
      >
        {visible ? 'Hide comments' : 'Show comments'}
      </button>

      {/* The stylesheet matches this exact class attribute value */}
      <div
        id="comment-wrapper"
        className={`comment-wrapper ${visible ? 'visible' : 'hidden'}`}
      >
        <h2 style={{ fontSize: 'xx-large' }}>Add comment</h2>
        <CommentForm
          onSubmit={async (comment) => {
            const created = await createComment(bearId, comment);
            // Newest first, so a new comment goes on top
            setComments((previous) => [created, ...previous]);
          }}
        />

        <h2 style={{ fontSize: 'xx-large' }}>Comments</h2>
        {loadError !== null && <p role="alert">{loadError}</p>}
        <CommentList comments={comments} />
        {nextCursor !== null && (
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => {
              void loadMore();
            }}
          >
            {loadingMore ? 'Loading…' : 'Load older comments'}
          </button>
        )}
      </div>
    </section>
  );
}
