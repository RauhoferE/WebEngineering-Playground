import { useEffect, useState } from 'react';
import { type BearsState } from './bear-models';
import { fetchBears } from './bears.api';

export function useBears(): BearsState {
  const [state, setState] = useState<BearsState>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();

    fetchBears(controller.signal)
      .then((bears) => {
        // fetchImageUrl swallows abort errors, so fetchBears can still resolve after abort
        if (controller.signal.aborted) return;
        setState(
          bears.length === 0
            ? { status: 'empty' }
            : { status: 'success', bears }
        );
      })
      .catch(() => {
        // SHow no error if fetch was aborted
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          message: 'Error: Bears could not be fetched',
        });
      });
    return () => {
      // Reject all pending fetches
      controller.abort();
    };
  }, []);
  return state;
}
