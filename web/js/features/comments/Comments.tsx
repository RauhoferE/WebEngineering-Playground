import { useState, type ReactElement } from 'react';
import { type CommentEntry } from './comment-models';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';

export function Comments(): ReactElement {
  // The state for the visibility of the comments section
  const [visible, setVisible] = useState(false);
  // The state for the comments
  const [comments, setComments] = useState<CommentEntry[]>([
    {
      id: 0,
      name: 'Bob Fossil',
      text: 'Oh I am so glad you taught me all about the big brown angry guys...',
    },
  ]);

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
          onSubmit={(comment: CommentEntry) => {
            setComments((previous) => [...previous, comment]);
          }}
        />

        <h2 style={{ fontSize: 'xx-large' }}>Comments</h2>
        <CommentList comments={comments} />
      </div>
    </section>
  );
}
