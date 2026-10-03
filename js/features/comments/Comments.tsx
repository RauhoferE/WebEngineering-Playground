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
    <section className="comments">
      <div
        className="show-hide"
        onClick={() => {
          setVisible((previous) => !previous);
        }}
      >
        {visible ? 'Hide comments' : 'Show comments'}
      </div>

      {/* The stylesheet matches this exact class attribute value */}
      <div className={`comment-wrapper ${visible ? 'visible' : 'hidden'}`}>
        <span style={{ fontSize: 'xx-large' }}>Add comment</span>
        <CommentForm
          onSubmit={(comment: CommentEntry) => {
            setComments((previous) => [...previous, comment]);
          }}
        />

        <span style={{ fontSize: 'xx-large' }}>Comments</span>
        <CommentList comments={comments} />
      </div>
    </section>
  );
}
