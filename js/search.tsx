import {
  createContext,
  useContext,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";

// Context object
interface SearchContextValue {
  query: string;
  setQuery: (query: string) => void;
}

// Carries The active query in state
// the context lets components read the value without it beeing passed down as props
const SearchContext = createContext<SearchContextValue | null>(null);

// Hook that wraps context
// If context is null a component is trying to use the context outside of a provider, which is an error (undefined)
// Also subsequent null checks are not required
// It basically registers the component as a consumer of the context
function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (context === null) {
    throw new Error("Search components must be used inside <SearchProvider>");
  }
  return context;
}

// Sets the search query as empty and exposes it
// Rerurns when its state changes an returns a new SearchContext.Provider element
// Receives children as a props
// These are not rerun
export function SearchProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [query, setQuery] = useState("");
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

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

// Takes plain string and renders it with matches marked as <mark> elements
export function Highlight({ text }: { text: string }): ReactElement {
  // Here we register the component as a consumer of the context
  const { query } = useSearch();
  // Return text if query is empty
  if (query === "") return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // The capture group makes split() keep the matches, at every odd index
  const parts = text.split(new RegExp(`(${escapedQuery})`, "i"));

  // Renders results as mark
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="highlight">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
