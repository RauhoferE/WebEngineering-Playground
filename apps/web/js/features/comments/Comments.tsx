import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../../common/problem';
import { useAuth } from '../auth/AuthContext';
import { type CommentEntry } from './comment-models';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { createComment, deleteComment, fetchComments } from './comments.api';
import { useCommentStream } from '../../common/useCommentStream';

function isUnauthenticated(error: unknown): boolean {
  return error instanceof ApiError && error.problem.status === 401;
}

export function Comments({ bearId }: { bearId: string }): ReactElement {
  const { user, loading, setUser } = useAuth();
  // The state for the visibility of the comments section
  const [visible, setVisible] = useState(false);
  // The loaded comments, newest first
  const [comments, setComments] = useState<CommentEntry[]>([]);
  // Opaque position after the last loaded comment; null when there are no older ones
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // The comment whose DELETE is in flight
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Errors of the delete buttons, which have no form to show them in
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // A 401 although the UI showed us as logged in: the token expired or was revoked
  const [sessionExpired, setSessionExpired] = useState(false);
  // Announced after a delete, when the button that was pressed has disappeared
  const [notice, setNotice] = useState('');
  useCommentStream(bearId, setComments);
  // Focus target after a delete, so keyboard users do not land at the top of the page
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const pending = useRef<{ text: string; key: string } | null>(null);

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

  // Forget the user, so the whole UI (form, delete buttons, UserMenu) shows "logged out"
  const endSession = (): void => {
    setUser(null);
    setSessionExpired(true);
  };

  const removeFromList = (id: string): void => {
    setComments((previous) => previous.filter((c) => c.id !== id));
  };

  const handleCreate = async (comment: { text: string }): Promise<void> => {
    if (pending.current?.text !== comment.text) {
      pending.current = { text: comment.text, key: crypto.randomUUID() };
    }
    try {
      const created = await createComment(bearId, comment, pending.current.key);
      pending.current = null; // done: the next comment is a new intent
      // Newest first, so a new comment goes on top
      setComments((previous) =>
        previous.some((c) => c.id === created.id)
          ? previous
          : [created, ...previous]
      );
    } catch (error: unknown) {
      if (isUnauthenticated(error)) endSession();
      throw error; // CommentForm shows the message
    }
  };

  // UX only: hides the button where the API would answer 403. This is not a
  // security control: anyone can send the DELETE with curl, the server checks it
  const canDelete = (comment: CommentEntry): boolean =>
    user !== null &&
    (user.role === 'moderator' || user.id === comment.authorId);

  const handleDelete = async (comment: CommentEntry): Promise<void> => {
    setDeletingId(comment.id);
    setDeleteError(null);
    setNotice('');
    // Whether the pressed button disappears (deleted, or logged out)
    let buttonGone = true;
    try {
      await deleteComment(comment.id);
      removeFromList(comment.id);
      setNotice('Comment deleted');
    } catch (error: unknown) {
      if (!(error instanceof ApiError)) {
        buttonGone = false;
        setDeleteError('Error: The comment could not be deleted. Try again.');
      } else if (error.problem.status === 401) {
        endSession();
      } else if (error.problem.status === 404) {
        // Already gone, e.g. a moderator was faster: the list was out of date
        removeFromList(comment.id);
        setNotice('The comment had already been deleted');
      } else {
        // 403: the list was out of date, e.g. the moderator role was taken away
        buttonGone = false;
        setDeleteError(`Error: ${error.message}`);
      }
    } finally {
      setDeletingId(null);
      // Otherwise focus would drop to <body>, the top of the page for keyboard users
      if (buttonGone) listHeadingRef.current?.focus();
    }
  };

  let addComment: ReactElement | null;
  if (loading) {
    // Nothing yet: avoids flashing "Log in" for a user who is logged in
    addComment = null;
  } else if (user !== null) {
    addComment = <CommentForm onSubmit={handleCreate} />;
  } else {
    addComment = (
      <p>
        <Link to="/login">Log in</Link> to write a comment.
      </p>
    );
  }

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
        {sessionExpired && user === null && (
          <p role="alert" className="form-error">
            Your session has expired. Please log in again.
          </p>
        )}
        {addComment}

        {/* tabIndex -1: focusable from code (after a delete), but not a Tab stop */}
        <h2 ref={listHeadingRef} tabIndex={-1} style={{ fontSize: 'xx-large' }}>
          Comments
        </h2>
        {loadError !== null && <p role="alert">{loadError}</p>}
        {deleteError !== null && (
          <p role="alert" className="form-error">
            {deleteError}
          </p>
        )}
        {/* Always rendered, so screen readers announce changes */}
        <p role="status" className="sr-only">
          {notice}
        </p>
        <CommentList
          comments={comments}
          canDelete={canDelete}
          onDelete={(comment) => {
            void handleDelete(comment);
          }}
          deletingId={deletingId}
        />
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
