import {
  createContext,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

interface SearchContextValue {
  query: string;
  setQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (context === null) {
    throw new Error("Search components must be used inside <SearchProvider>");
  }
  return context;
}

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
