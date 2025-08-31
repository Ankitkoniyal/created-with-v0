"use client"

import { useState, useCallback } from "react"
import { useErrorBoundary } from "@/components/error-boundary"

interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseAsyncOperationOptions {
  retries?: number
  retryDelay?: number
  onError?: (error: Error) => void
  onSuccess?: () => void
}

export function useAsyncOperation<T>(operation: () => Promise<T>, options: UseAsyncOperationOptions = {}) {
  const { retries = 3, retryDelay = 1000, onError, onSuccess } = options
  const { captureError } = useErrorBoundary()

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (attempt = 0): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const result = await operation()
        setState({ data: result, loading: false, error: null })
        onSuccess?.()
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

        if (attempt < retries) {
          // Retry with exponential backoff
          const delay = retryDelay * Math.pow(2, attempt)
          setTimeout(() => execute(attempt + 1), delay)
          return null
        }

        setState({ data: null, loading: false, error: errorMessage })
        onError?.(error instanceof Error ? error : new Error(errorMessage))

        // Don't throw to error boundary for network errors
        if (!errorMessage.includes("network") && !errorMessage.includes("fetch")) {
          captureError(error instanceof Error ? error : new Error(errorMessage))
        }

        return null
      }
    },
    [operation, retries, retryDelay, onError, onSuccess, captureError],
  )

  const retry = useCallback(() => {
    execute()
  }, [execute])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    retry,
    reset,
  }
}
