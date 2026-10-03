import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router';

interface SearchContextValue {
  query: string;
  setQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (context === null) {
    throw new Error('Search components must be used inside <SearchProvider>');
  }
  return context;
}

export function SearchProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  // Url becomes single source of truth for query search
  // Get the search query from url
  const query = searchParams.get('q') ?? '';

  // If query input is used set the url params
  const setQuery = (next: string): void => {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous);
      if (next === '') params.delete('q');
      else params.set('q', next);
      return params;
    });
  };
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}
