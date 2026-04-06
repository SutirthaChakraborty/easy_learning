import { useState, useEffect } from 'react';
import apiClient from '../services/api.js';

/**
 * Generic data-fetching hook backed by the shared Axios instance.
 *
 * @param {string} url - Relative API path (e.g. '/users').
 * @returns {{ data: any, loading: boolean, error: string|null }}
 *
 * @example
 *   const { data, loading, error } = useFetch('/users');
 */
function useFetch(url) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    // Guard against setting state after unmount
    let cancelled = false;

    setLoading(true);
    setError(null);

    apiClient
      .get(url)
      .then((responseData) => {
        if (!cancelled) setData(responseData);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Unknown error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

export default useFetch;
