import { useRef, useState, type FormEvent, type ReactElement } from "react";
import { Highlight } from "./search";

interface CommentEntry {
  id: number;
  name: string;
  text: string;
}

export function Comments(): ReactElement {
  // The state for the visibility of the comments section
  const [visible, setVisible] = useState(false);
  // The state for the comments
  const [comments, setComments] = useState<CommentEntry[]>([
    {
      id: 0,
      name: "Bob Fossil",
      text: "Oh I am so glad you taught me all about the big brown angry guys...",
    },
  ]);
  // The state for the name input field
  const [name, setName] = useState("");

  // The state for the comment input field
  const [text, setText] = useState("");

  // useRef is used for non UI states
  const nextId = useRef(1);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (name.trim().length === 0 || text.trim().length === 0) {
      window.alert("Error: Name and Comment can't be empty");
      return;
    }

    const id = nextId.current;
    nextId.current += 1;
    setComments((previous) => [...previous, { id, name, text }]);
    setName("");
    setText("");
  };

  return (
    <section className="comments">
      <div
        className="show-hide"
        onClick={() => {
          setVisible((previous) => !previous);
        }}
      >
        {visible ? "Hide comments" : "Show comments"}
      </div>

      {/* The stylesheet matches this exact class attribute value */}
      <div className={`comment-wrapper ${visible ? "visible" : "hidden"}`}>
        <span style={{ fontSize: "xx-large" }}>Add comment</span>
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="flex-pair">
            Your name:
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>
          <div className="flex-pair">
            Your comment:
            <input
              type="text"
              name="comment"
              id="comment"
              placeholder="Enter your comment"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
            />
          </div>
          <div>
            <input type="submit" value="Submit comment" />
          </div>
        </form>

        <span style={{ fontSize: "xx-large" }}>Comments</span>
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
      </div>
    </section>
  );
}
