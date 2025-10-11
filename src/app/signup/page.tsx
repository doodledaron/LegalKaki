'use client'

import { SignUpScreen } from '@/components/screens/SignUpScreen'
import { useRouter } from 'next/navigation'
import { authApi } from '@/api'

export default function SignUpPage() {
  const router = useRouter()

  const handleSignUp = async (formData: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }) => {
    try {
      console.log('Sign up attempt:', formData)
      
      // Call the new signup API
      const response = await authApi.signUp({
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
      })
      
      console.log('Signup response:', response)
      
      if (response.success) {
        // Store email for verification page
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingVerificationEmail', formData.email)
        }
        
        console.log('Signup successful, redirecting to verification page')
        
        // Redirect to email verification page
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        // Handle API error response
        const errorMessage = 'message' in response ? response.message : 'Sign up failed. Please try again.'
        console.error('Signup failed:', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Sign up error:', error)
      
      // Extract meaningful error message
      let errorMessage = 'Sign up failed. Please try again.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Handle specific error cases
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Password does not meet requirements. Please try a stronger password.'
      } else if (errorMessage.includes('email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      }
      
      throw new Error(errorMessage)
    }
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
