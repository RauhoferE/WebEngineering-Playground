import { type ReactElement } from 'react';
import { useSearch } from './SearchContext';

// Takes plain string and renders it with matches marked as <mark> elements
export function Highlight({ text }: { text: string }): ReactElement {
  // Here we register the component as a consumer of the context
  const { query } = useSearch();
  // Return text if query is empty
  if (query === '') return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // The capture group makes split() keep the matches, at every odd index
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'i'));

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
        )
      )}
    </>
  );
}
