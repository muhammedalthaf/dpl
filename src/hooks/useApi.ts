import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = { showErrorToast: true }
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setState({ data: null, loading: true, error: null });
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        if (options.showSuccessToast) {
          toast.success('Operation completed successfully');
        }
        return result;
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });
        if (options.showErrorToast) {
          const errorMessage = err?.response?.data?.detail || err?.message || 'An error occurred';
          toast.error(errorMessage);
        }
        throw error;
      }
    },
    [apiFunction, options]
  );

  return {
    ...state,
    execute,
  };
}

export function useApiList<T>(
  apiFunction: (skip: number, limit: number, ...args: any[]) => Promise<any>
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (skip: number = 0, limit: number = 10, ...args: any[]) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(skip, limit, ...args);
        setData(result.players || result.teams || result.registrations || result.items || []);
        setTotal(result.total || 0);
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        toast.error(err?.response?.data?.detail || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  return {
    data,
    total,
    loading,
    error,
    fetchData,
  };
}
