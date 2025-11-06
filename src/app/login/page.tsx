'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// POC Mode: Login page redirects to /domains (authentication is bypassed)
export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to domains page in POC mode
    router.push('/domains')
  }, [router])

  // Show a simple loading state during redirect
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-primary border-t-transparent mx-auto mb-4"></div>
        <p className="body-regular text-text-secondary">Redirecting to LegalKaki...</p>
      </div>
    </div>
  )
}
