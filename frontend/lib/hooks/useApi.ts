import { useState, useEffect } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const result = await apiCall()
      setState({ data: result, loading: false, error: null })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'An error occurred'
      setState({ data: null, loading: false, error: message })
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies)

  return {
    ...state,
    refetch: fetchData,
  }
}
