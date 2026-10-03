import { type FormEvent, type ReactElement, useRef, useState } from "react";

export function CommentForm({
  onSubmit,
}: {
  onSubmit: (comment: { id: number; name: string; text: string }) => void;
}): ReactElement {
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

    const trimmedName = name.trim();
    const trimmedText = text.trim();

    const id = nextId.current;
    nextId.current += 1;
    onSubmit({ id, name: trimmedName, text: trimmedText });
    setName("");
    setText("");
  };

  return (
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
  );
}
