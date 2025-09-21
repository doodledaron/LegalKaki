/* eslint-disable react-hooks/exhaustive-deps */
// Main API exports
export { api as default } from './endpoints'
export * from './types'
export * from './endpoints'
export { mockClient, mockUtils, progressTracker } from './mockClient'
export * from './mockData'

// Convenience re-exports for common usage
export { 
  authApi, 
  userApi, 
  domainsApi, 
  chatApi, 
  documentsApi, 
  collectionsApi, 
  actionsApi, 
  searchApi, 
  toolsApi,
  pdfApi 
} from './endpoints'

// Hook-like utilities for React components
import { useEffect, useState } from 'react'
import { ApiResponse, ApiError } from './types'
import { progressTracker } from './mockClient'

// Custom hook for API calls with loading and error states
export function useApiCall<T>(
  apiCall: () => Promise<ApiResponse<T> | ApiError>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await apiCall()
        
        if (mounted) {
          if (result.success) {
            setData(result.data)
          } else {
            setError('An error occurred')
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, dependencies)

  return { data, loading, error }
}

// Custom hook for API mutations with loading and error states
export function useApiMutation<TRequest, TResponse>(
  apiCall: (request: TRequest) => Promise<ApiResponse<TResponse> | ApiError>
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TResponse | null>(null)

  const mutate = async (request: TRequest): Promise<TResponse | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiCall(request)
      
      if (result.success) {
        setData(result.data)
        return result.data
      } else {
        setError('An error occurred')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(null)
    setError(null)
    setLoading(false)
  }

  return { mutate, loading, error, data, reset }
}

// Utility function to check if response is an error
export function isApiError<T>(response: ApiResponse<T> | ApiError): response is ApiError {
  return !response.success
}

// Utility function to handle API responses with callbacks
export async function handleApiResponse<T>(
  response: ApiResponse<T> | ApiError,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
): Promise<T | null> {
  if (response.success) {
    onSuccess?.(response.data)
    return response.data
  } else {
    onError?.('An error occurred')
    return null
  }
}

// Progress tracking hook
export function useProgress(id: string) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const callback = (prog: number, stat: string) => {
      setProgress(prog)
      setStatus(stat)
    }

    progressTracker.register(id, callback)
    
    return () => {
      progressTracker.unregister(id)
    }
  }, [id])

  return { progress, status }
}