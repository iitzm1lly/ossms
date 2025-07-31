// DISABLED: This hook is not compatible with Tauri
// It imports apiService which has been disabled for the desktop app
// Use tauriApiService directly instead

/*
"use client"

import { useState, useCallback } from "react"
import apiService from "@/components/services/apiService"
import type { AxiosRequestConfig, AxiosResponse } from "axios"

interface ApiState<T> {
  data: T | null
  isLoading: boolean
  error: any | null
}

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

export function useApi<T = any>(options?: UseApiOptions) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const request = useCallback(
    async <R = T>(
      method: string,
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<R> | undefined> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        let response: AxiosResponse<R>

        switch (method.toLowerCase()) {
          case "get":
            response = await apiService.get<R>(url, config)
            break
          case "post":
            response = await apiService.post<R>(url, data, config)
            break
          case "put":
            response = await apiService.put<R>(url, data, config)
            break
          case "delete":
            response = await apiService.delete<R>(url, config)
            break
          default:
            throw new Error(`Unsupported method: ${method}`)
        }

        setState({
          data: response.data as unknown as T,
          isLoading: false,
          error: null,
        })

        options?.onSuccess?.(response.data)
        return response
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error,
        })

        options?.onError?.(error)
        return undefined
      }
    },
    [options],
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    request,
    reset,
    get: useCallback((url: string, config?: AxiosRequestConfig) => request("get", url, undefined, config), [request]),
    post: useCallback(
      (url: string, data?: any, config?: AxiosRequestConfig) => request("post", url, data, config),
      [request],
    ),
    put: useCallback(
      (url: string, data?: any, config?: AxiosRequestConfig) => request("put", url, data, config),
      [request],
    ),
    delete: useCallback((url: string, config?: AxiosRequestConfig) => request("delete", url, config), [request]),
  }
}
*/

