import { Link, useParams } from 'react-router';
import { useBears } from './useBears';
import { BearImage } from './BearImage';
import { type ReactElement } from 'react';

export function BearDetail(): ReactElement {
  const { bearId } = useParams();
  const state = useBears();
  if (state.status === 'loading') return <p>Loading bear…</p>;
  if (state.status === 'error') return <p role="alert">{state.message}</p>;

  const bear =
    state.status === 'success'
      ? state.bears.find((b) => b.id === bearId)
      : undefined;
  if (bear === undefined)
    return (
      <p>
        No bear with the id “{bearId}” exists. <Link to="/">Back to list</Link>
      </p>
    );

  return (
    <article>
      <h2>{bear.name}</h2>
      <BearImage bear={bear} width="400px" />
      <p>
        <i>{bear.binomial}</i>
      </p>
      <p>Range: {bear.range}</p>
      <Link to="/">← Back to all bears</Link>
    </article>
  );
}
