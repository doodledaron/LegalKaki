'use client'

import { WelcomeScreen } from '@/components/screens/WelcomeScreen'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

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

  return (
    <WelcomeScreen 
      onGetStarted={handleGetStarted} 
      onViewCollection={handleViewCollection}
      onLogin={handleLogin}
      onSignUp={handleSignUp}
    />
  )
}
