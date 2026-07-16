import { useEffect, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Runs `fetcher` whenever `enabled` becomes true or a value in `deps` changes.
 * Pass `enabled: false` while a precondition (e.g. schoolId not yet resolved) isn't met.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  enabled = true,
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: enabled,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, isLoading: false });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, isLoading: false });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, error, isLoading: false });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return state;
}
