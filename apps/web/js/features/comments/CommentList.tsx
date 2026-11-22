import { type ReactElement } from 'react';
import { type CommentEntry } from './comment-models';
import { Highlight } from '../search/Highlight';

interface CommentListProps {
  comments: CommentEntry[];
  // UX only: true where the API would allow the delete. The server still decides (401/403)
  canDelete: (comment: CommentEntry) => boolean;
  onDelete: (comment: CommentEntry) => void;
  // The comment whose DELETE is in flight, so its button cannot be pressed twice
  deletingId: string | null;
}

export function CommentList({
  comments,
  canDelete,
  onDelete,
  deletingId,
}: CommentListProps): ReactElement {
  return (
    <ul className="comment-container">
      {comments.map((comment) => {
        const textId = `comment-${comment.id}-text`;
        const deleting = deletingId === comment.id;
        return (
          <li key={comment.id}>
            <p>
              <Highlight text={comment.author} />
            </p>
            <p id={textId}>
              <Highlight text={comment.text} />
            </p>
            {canDelete(comment) && (
              <button
                type="button"
                // Without the author every button would be announced as just "Delete";
                // the description adds the text, for authors with several comments
                aria-label={`Delete comment by ${comment.author}`}
                aria-describedby={textId}
                disabled={deleting}
                onClick={() => {
                  onDelete(comment);
                }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
