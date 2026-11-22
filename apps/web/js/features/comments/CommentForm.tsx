import { type FormEvent, type ReactElement, useState } from 'react';
import { ApiError } from '../../common/problem';

export function CommentForm({
  onSubmit,
}: {
  onSubmit: (comment: { text: string }) => Promise<void>;
}): ReactElement {
  // The state for the comment input field
  const [text, setText] = useState('');

  // Validation message, announced to screen readers via role="alert"
  const [error, setError] = useState<string | null>(null);
  // Confirmation message, announced via the always-present status region
  const [notice, setNotice] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (text.trim().length === 0) {
      setError("Error: Comment can't be empty");
      setNotice('');
      return;
    }

    const trimmedText = text.trim();

    onSubmit({ text: trimmedText })
      .then(() => {
        setText('');
        setError(null);
        setNotice('Comment added');
      })
      .catch((error: unknown) => {
        setError(
          error instanceof ApiError
            ? `Error: ${error.message}`
            : 'Error: Comment could not be added'
        );
        setNotice('');
      });
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit} noValidate>
      <div className="flex-pair">
        <label htmlFor="comment">Your comment:</label>
        <input
          type="text"
          name="comment"
          id="comment"
          placeholder="Enter your comment"
          aria-invalid={error !== null && text.trim().length === 0}
          aria-describedby={error !== null ? 'comment-error' : undefined}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
        />
      </div>
      {error !== null && (
        <p id="comment-error" role="alert" className="form-error">
          {error}
        </p>
      )}
      <p role="status" className="sr-only">
        {notice}
      </p>
      <div>
        <input type="submit" value="Submit comment" />
      </div>
    </form>
  );
}
