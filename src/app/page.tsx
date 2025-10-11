'use client'

import { WelcomeScreen } from '@/components/screens/WelcomeScreen'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  const handleGetStarted = () => {
    router.push('/domains')
  }

  const handleViewCollection = () => {
    router.push('/collections')
  }

  const handleLogin = () => {
    router.push('/login')
  }

  const handleSignUp = () => {
    router.push('/signup')
  }

  // Show a loading state while authentication status is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-primary border-t-transparent mx-auto mb-4"></div>
          <p className="body-regular text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  // Always render WelcomeScreen, but pass authentication status to conditionally show/hide auth buttons
  return (
    <WelcomeScreen 
      onGetStarted={handleGetStarted} 
      onViewCollection={handleViewCollection}
      onLogin={isAuthenticated ? undefined : handleLogin}
      onSignUp={isAuthenticated ? undefined : handleSignUp}
      isAuthenticated={isAuthenticated}
    />
  )
}
