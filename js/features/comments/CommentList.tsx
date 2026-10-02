import { type ReactElement } from "react";
import { type CommentEntry } from "./comment-models";
import { Highlight } from "../search/search";

export function CommentList({
  comments,
}: {
  comments: CommentEntry[];
}): ReactElement {
  return (
    <ul className="comment-container">
      {comments.map((comment) => (
        <li key={comment.id}>
          <p>
            <Highlight text={comment.name} />
          </p>
          <p>
            <Highlight text={comment.text} />
          </p>
        </li>
      ))}
    </ul>
  );
}
