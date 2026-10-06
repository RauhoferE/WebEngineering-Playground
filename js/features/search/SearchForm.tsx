import {
  type FormEvent,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSearch } from './SearchContext';

export function SearchForm(): ReactElement {
  // Shared query in context -> Only changes when form is submitted
  const { query, setQuery } = useSearch();
  // Holds what is currently beeing typed
  const [input, setInput] = useState('');
  const statusRef = useRef<HTMLParagraphElement>(null);

  // Tell screen reader users the outcome of a search, since the only visible
  // feedback is the highlighting
  useEffect(() => {
    if (statusRef.current === null) return;
    if (query === '') {
      statusRef.current.textContent = '';
      return;
    }
    const count = document.querySelectorAll('mark.highlight').length;
    statusRef.current.textContent =
      count === 0
        ? `No results for “${query}”`
        : `${count} ${count === 1 ? 'result' : 'results'} for “${query}”`;
  }, [query]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // An empty query clears the highlights
    setQuery(input.trim());
  };

  return (
    <form className="search" role="search" onSubmit={handleSubmit}>
      <label htmlFor="search-input" className="sr-only">
        Search this page
      </label>
      <input
        id="search-input"
        type="search"
        name="q"
        placeholder="Search query"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
      />
      <input type="submit" value="Search" />
      <p role="status" className="sr-only" ref={statusRef} />
    </form>
  );
}
