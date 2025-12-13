/**
 * Hook for managing async API calls with loading and error states
 */
import { useState, useCallback } from 'react';

/**
 * useAsync Hook
 * Manages loading, error, and data states for async operations
 */
export function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // The execute function wraps asyncFunction and
  // handles setting state for pending, success, and error states
  const execute = useCallback(
    async (...params) => {
      setStatus('pending');
      setData(null);
      setError(null);
      try {
        const response = await asyncFunction(...params);
        setData(response);
        setStatus('success');
        return response;
      } catch (err) {
        setError(err);
        setStatus('error');
        throw err;
      }
    },
    [asyncFunction]
  );

  // Call execute if we want to fire it right away.
  // Otherwise, it'll be up to the caller to invoke it.
  if (immediate) {
    execute();
  }

  return { execute, status, data, error };
}

export default useAsync;
