'use client'

import { usePathname } from 'next/navigation'
import { SideNavigation } from './SideNavigation'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Routes that should not show the side navigation
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.includes(pathname)

  if (isAuthRoute) {
    // Full screen layout for auth pages
    return (
      <main className="h-full">
        {children}
      </main>
    )
  }

  // Default layout with side navigation
  return (
    <div className="flex h-full">
      <SideNavigation />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
