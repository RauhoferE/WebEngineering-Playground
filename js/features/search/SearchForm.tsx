import { type FormEvent, type ReactElement, useState } from "react";
import { useSearch } from "./SearchContext";

export function SearchForm(): ReactElement {
  // Shared query in context -> Only changes when form is submitted
  const { setQuery } = useSearch();
  // Holds what is currently beeing typed
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // An empty query clears the highlights
    setQuery(input.trim());
  };

  return (
    <form className="search" onSubmit={handleSubmit}>
      <input
        type="search"
        name="q"
        placeholder="Search query"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
      />
      <input type="submit" value="Go!" />
    </form>
  );
}
