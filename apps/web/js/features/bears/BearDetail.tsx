import { Link, useParams } from 'react-router';
import { BearImage } from './BearImage';
import { type ReactElement } from 'react';
import { useBear } from './useBear';

export function BearDetail(): ReactElement {
  const { bearId } = useParams();
  const state = useBear(bearId ?? '');
  if (state.status === 'loading') return <p role="status">Loading bear…</p>;
  if (state.status === 'error') return <p role="alert">{state.message}</p>;
  if (state.status === 'notFound')
    return (
      <p>
        No bear with the id “{bearId}” exists. <Link to="/">Back to list</Link>
      </p>
    );
  const { bear } = state;

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
