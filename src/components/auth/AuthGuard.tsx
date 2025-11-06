'use client'

// POC Mode: AuthGuard is disabled - all pages are accessible without authentication
interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  // In POC mode, simply render children without any authentication check
  return <>{children}</>
}

// Higher-order component for protecting pages (disabled in POC mode)
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    // In POC mode, render component directly without auth check
    return <Component {...props} />
  }
}
