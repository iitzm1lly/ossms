"use client"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ApiErrorAlertProps {
  title?: string
  error: any
  onRetry?: () => void
  onDismiss?: () => void
}

export function ApiErrorAlert({ title = "An error occurred", error, onRetry, onDismiss }: ApiErrorAlertProps) {
  // Extract the most useful error message
  const getErrorMessage = () => {
    if (typeof error === "string") return error

    // Check for Tauri error structure
    if (error.message) {
      return error.message
    }

    // Check for Axios error structure (for backward compatibility)
    if (error.response?.data?.message) {
      return error.response.data.message
    }

    if (error.response?.data?.error) {
      return error.response.data.error
    }

    return "An unexpected error occurred"
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">{getErrorMessage()}</p>

        {/* Show technical details in development environment */}
        {process.env.NODE_ENV === "development" && error && (
          <details className="mt-2 text-xs">
            <summary>Technical Details</summary>
            <pre className="mt-2 whitespace-pre-wrap bg-gray-100 p-2 rounded">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}

        <div className="mt-3 flex gap-2">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

