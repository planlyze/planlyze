/**
 * Hook for making API requests with automatic error handling and retries
 */
import { useCallback, useRef } from 'react';
import { useAsync } from './useAsync';

/**
 * useApi Hook
 * Wrapper around useAsync for API calls with built-in retry logic
 */
export function useApi(apiFunction, options = {}) {
  const { immediate = true, retry = 3, delay = 1000 } = options;
  const retryCountRef = useRef(0);

  const wrappedFunction = useCallback(
    async (...params) => {
      try {
        const result = await apiFunction(...params);
        retryCountRef.current = 0; // Reset retry count on success
        return result;
      } catch (error) {
        if (retryCountRef.current < retry) {
          retryCountRef.current += 1;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return wrappedFunction(...params);
        }
        throw error;
      }
    },
    [apiFunction, retry, delay]
  );

  return useAsync(wrappedFunction, immediate);
}

export default useApi;
