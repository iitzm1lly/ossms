"use client"

import { ReactNode } from 'react'
import { getCurrentUser, hasPermission } from '@/lib/permissions'

interface PermissionGuardProps {
  module: string
  action: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({ module, action, children, fallback }: PermissionGuardProps) {
  const userHasPermission = hasPermission(getCurrentUser(), module, action)
  
  if (!userHasPermission) {
    return fallback ? <>{fallback}</> : null
  }
  
  return <>{children}</>
}

// Higher-order component for protecting entire pages
export function withPermissionGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  module: string,
  action: string
) {
  return function PermissionProtectedComponent(props: P) {
    const userHasPermission = hasPermission(getCurrentUser(), module, action)
    
    if (!userHasPermission) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    }
    
    return <WrappedComponent {...props} />
  }
} 