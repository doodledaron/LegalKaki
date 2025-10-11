'use client'

import { LoginScreen } from '@/components/screens/LoginScreen'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // Don't render anything if already authenticated
  if (isAuthenticated) {
    return null
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('Login attempt:', { email, password })
      
      // Use the auth context login method
      await login({
        email: email,
        password: password,
      })
      
      // Login successful, redirect to home
      router.push('/')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const handleSignUpRedirect = () => {
    router.push('/signup')
  }

  const handleForgotPassword = () => {
    // TODO: Implement forgot password functionality
    console.log('Forgot password clicked')
  }

  return (
    <LoginScreen 
      onLogin={handleLogin}
      onSignUpRedirect={handleSignUpRedirect}
      onForgotPassword={handleForgotPassword}
    />
  )
}
