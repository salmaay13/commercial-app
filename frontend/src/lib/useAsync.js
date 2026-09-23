import { useCallback, useEffect, useState } from 'react';

/** Charge des données et expose { data, loading, error, reload }. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  const load = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    run()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((e) => !cancelled && setState({ data: null, loading: false, error: e.message }));
    return () => { cancelled = true; };
  }, [run]);
  useEffect(() => load(), [load]);
  return { ...state, reload: load };
}
