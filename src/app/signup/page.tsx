'use client'

import { SignUpScreen } from '@/components/screens/SignUpScreen'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()

  const handleSignUp = async (formData: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }) => {
    // TODO: Implement actual sign-up logic
    console.log('Sign up attempt:', formData)
    
    // For now, just redirect to login after "successful" sign-up
    setTimeout(() => {
      router.push('/login')
    }, 1000)
  }

  const handleLoginRedirect = () => {
    router.push('/login')
  }

  return (
    <SignUpScreen 
      onSignUp={handleSignUp}
      onLoginRedirect={handleLoginRedirect}
    />
  )
}
