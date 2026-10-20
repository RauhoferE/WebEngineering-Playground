import { useEffect, useState } from 'react';
import { type BearState } from './bear-models';
import { fetchBear, NotFoundError } from './bears.api';

export function useBear(id: string): BearState {
  const [state, setState] = useState<BearState>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    fetchBear(id, controller.signal)
      .then((bear) => {
        setState({ status: 'success', bear });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState(
          error instanceof NotFoundError
            ? { status: 'notFound' }
            : { status: 'error', message: 'Error: Bear could not be fetched' }
        );
      });
    return () => {
      controller.abort();
    };
  }, [id]);
  return state;
}
