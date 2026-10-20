import { useEffect, useState, type ReactElement } from 'react';
import { type CommentEntry } from './comment-models';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { createComment, fetchComments } from './comments.api';
import { ApiError } from '../../common/problem';

export function Comments({ bearId }: { bearId: string }): ReactElement {
  // The state for the visibility of the comments section
  const [visible, setVisible] = useState(false);
  // The state for the comments
  const [comments, setComments] = useState<CommentEntry[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchComments(bearId, controller.signal)
      .then(setComments)
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
            setComments((previous) => [...previous, created]);
          }}
        />

        <h2 style={{ fontSize: 'xx-large' }}>Comments</h2>
        {loadError !== null && <p role="alert">{loadError}</p>}
        <CommentList comments={comments} />
      </div>
    </section>
  );
}
