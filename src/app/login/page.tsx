'use client'

import { LoginScreen } from '@/components/screens/LoginScreen'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = async (email: string, password: string) => {
    // TODO: Implement actual authentication logic
    console.log('Login attempt:', { email, password })
    
    // For now, just redirect to home after "successful" login
    setTimeout(() => {
      router.push('/')
    }, 1000)
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
