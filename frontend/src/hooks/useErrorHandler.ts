/**
 * React Hook for Standardized Error Handling
 * Provides consistent error handling patterns for React components
 */

import { useState, useCallback, useMemo } from 'react';
import {
  errorHandler,
  ErrorCode,
  ErrorSeverity,
  StandardError,
  ErrorContext,
} from '../utils/errorHandler';

export interface UseErrorHandlerReturn {
  error: StandardError | null;
  isLoading: boolean;
  isError: boolean;
  setError: (error: StandardError | null) => void;
  clearError: () => void;
  handleError: (error: any, context?: Partial<ErrorContext>) => StandardError;
  handleAsync: <T>(asyncFn: () => Promise<T>, context?: Partial<ErrorContext>) => Promise<T | null>;
  retry: () => void;
  lastRetryFn: (() => Promise<any>) | null;
}

export interface UseErrorHandlerOptions {
  component?: string;
  userId?: string;
  onError?: (error: StandardError) => void;
  onRetry?: () => void;
  autoRetry?: boolean;
  maxRetries?: number;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const { component, userId, onError, onRetry, autoRetry = false, maxRetries = 3 } = options;

  const [error, setError] = useState<StandardError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryFn, setLastRetryFn] = useState<(() => Promise<any>) | null>(null);

  const isError = error !== null;

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const handleError = useCallback(
    (error: any, context?: Partial<ErrorContext>): StandardError => {
      const errorContext = {
        component,
        userId,
        ...context,
      };

      let standardError: StandardError;

      if (error instanceof Error && 'code' in error) {
        // Already a StandardError
        standardError = error as unknown as StandardError;
      } else {
        // Handle API errors or other errors
        standardError = errorHandler.handleApiError(error, errorContext);
      }

      setError(standardError);
      onError?.(standardError);

      return standardError;
    },
    [component, userId, onError],
  );

  const handleAsync = useCallback(
    async <T>(asyncFn: () => Promise<T>, context?: Partial<ErrorContext>): Promise<T | null> => {
      try {
        setIsLoading(true);
        clearError();

        const result = await asyncFn();
        setRetryCount(0);
        return result;
      } catch (err) {
        const standardError = handleError(err, context);

        if (autoRetry && retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          // Auto-retry after a delay
          setTimeout(
            () => {
              handleAsync(asyncFn, context);
            },
            1000 * Math.pow(2, retryCount),
          ); // Exponential backoff
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError, autoRetry, retryCount, maxRetries],
  );

  const retry = useCallback(() => {
    if (lastRetryFn) {
      setRetryCount(0);
      handleAsync(lastRetryFn);
      onRetry?.();
    }
  }, [lastRetryFn, handleAsync, onRetry]);

  const setErrorWithContext = useCallback(
    (error: StandardError | null) => {
      setError(error);
      if (error) {
        onError?.(error);
      }
    },
    [onError],
  );

  return {
    error,
    isLoading,
    isError,
    setError: setErrorWithContext,
    clearError,
    handleError,
    handleAsync,
    retry,
    lastRetryFn,
  };
};

// Specialized hooks for common use cases
export const useApiErrorHandler = (component?: string, userId?: string) => {
  return useErrorHandler({
    component,
    userId,
    autoRetry: false,
  });
};

export const useDataErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  return useErrorHandler({
    ...options,
    autoRetry: true,
    maxRetries: 2,
  });
};

export const useMLErrorHandler = (component?: string, userId?: string) => {
  return useErrorHandler({
    component,
    userId,
    autoRetry: false, // ML errors usually don't benefit from retry
  });
};

// Hook for error boundary integration
export const useErrorBoundary = () => {
  const [error, setError] = useState<StandardError | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: any, context?: Partial<ErrorContext>) => {
    const standardError = errorHandler.handleApiError(error, context);
    setError(standardError);
    return standardError;
  }, []);

  return {
    error,
    resetError,
    captureError,
  };
};
