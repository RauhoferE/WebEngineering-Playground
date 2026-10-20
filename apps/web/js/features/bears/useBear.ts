import { useEffect, useState } from 'react';
import { type BearState } from './bear-models';
import { fetchBear } from './bears.api';
import { ApiError } from '../../common/problem';

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
        if (error instanceof ApiError && error.problem.status === 404) {
          setState({ status: 'notFound' });
          return;
        }
        setState({
          status: 'error',
          message:
            error instanceof ApiError
              ? `Error: ${error.message}`
              : 'Error: Bear could not be fetched',
        });
      });
    return () => {
      controller.abort();
    };
  }, [id]);
  return state;
}
