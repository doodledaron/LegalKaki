'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page if not authenticated
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-primary border-t-transparent mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Loading...</h2>
          <p className="text-text-secondary">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show fallback or nothing if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return fallback || null
  }

  // Render protected content if authenticated
  return <>{children}</>
}

// Higher-order component for protecting pages
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    return (
      <AuthGuard>
        <Component {...props} />
      </AuthGuard>
    )
  }
}
