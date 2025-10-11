'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmailVerificationScreen } from '@/components/screens/EmailVerificationScreen'
import { authApi } from '@/api'

function EmailVerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [error, setError] = useState<string | undefined>(undefined)

  // Get email from URL params or localStorage
  const email = searchParams.get('email') || (typeof window !== 'undefined' ? localStorage.getItem('pendingVerificationEmail') : null)
  
  // Debug logging
  console.log('Email from URL:', searchParams.get('email'))
  console.log('Email from localStorage:', typeof window !== 'undefined' ? localStorage.getItem('pendingVerificationEmail') : 'N/A')
  console.log('Final email:', email)

  useEffect(() => {
    // Add a small delay to allow localStorage to be available
    const timer = setTimeout(() => {
      // If no email is provided, redirect to signup
      if (!email) {
        console.log('No email found, redirecting to signup')
        router.push('/signup')
        return
      }

      // Check if there's a verification token in the URL
      const token = searchParams.get('token')
      if (token) {
        // Handle email verification with token
        handleEmailVerification(token)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [email, router, searchParams])

  const handleEmailVerification = async (token: string) => {
    try {
      // TODO: Implement actual email verification API call
      console.log('Verifying email with token:', token)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo purposes, assume verification is successful
      // In real implementation, you would call your verification API
      const isVerified = true
      
      if (isVerified) {
        // Clear pending email from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingVerificationEmail')
        }
        
        // Redirect to success page or dashboard
        router.push('/?verified=true')
      } else {
        // Handle verification failure
        console.error('Email verification failed')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      // Handle verification error
    }
  }

  const handleResendEmail = async () => {
    if (!email) return
    
    setIsResending(true)
    setError(undefined)
    
    try {
      console.log('Resending verification code to:', email)
      
      // Call the dedicated resend code API
      const response = await authApi.resendCode({
        email: email,
      })
      
      console.log('Resend response:', response)
      
      if (response.success) {
        // Reset cooldown
        setResendCooldown(60)
        
        console.log('Verification code resent successfully')
        // You could show a success toast here
      } else {
        const errorMessage = 'message' in response ? response.message : 'Failed to resend verification code.'
        console.error('Resend failed:', errorMessage)
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Failed to resend code:', error)
      
      // Extract meaningful error message
      let errorMessage = 'Failed to resend verification code. Please try again.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Handle specific error cases
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        errorMessage = 'Account not found. Please sign up again.'
      } else if (errorMessage.includes('already verified')) {
        errorMessage = 'Account is already verified. Please try signing in.'
      }
      
      setError(errorMessage)
    } finally {
      setIsResending(false)
    }
  }

  const handleVerifyCode = async (code: string) => {
    if (!email) return
    
    setIsVerifying(true)
    setError(undefined)
    
    try {
      console.log('Verifying code:', code, 'for email:', email)
      
      // Call the new confirm-signup API
      const response = await authApi.confirmSignup({
        username: email, // Using email as username for Cognito
        confirmation_code: code,
      })
      
      console.log('Verification response:', response)
      
      if (response.success) {
        // Clear pending email from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingVerificationEmail')
        }
        
        console.log('Email verification successful')
        
        // Redirect to success page or dashboard
        router.push('/?verified=true')
      } else {
        // Handle API error response
        const errorMessage = 'message' in response ? response.message : 'Invalid verification code. Please try again.'
        console.error('Verification failed:', errorMessage)
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Verification error:', error)
      
      // Extract meaningful error message
      let errorMessage = 'Verification failed. Please try again.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Handle specific error cases
      if (errorMessage.includes('invalid') || errorMessage.includes('expired')) {
        errorMessage = 'Invalid or expired verification code. Please request a new one.'
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      }
      
      setError(errorMessage)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  const handleVerificationComplete = () => {
    // This would be called when verification is successful
    router.push('/?verified=true')
  }

  // Show loading state while checking for email
  if (!email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-primary border-t-transparent mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Loading Verification</h2>
          <p className="text-text-secondary mb-6">
            Setting up your email verification...
          </p>
          <Button
            variant="ghost"
            onClick={() => router.push('/signup')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Sign Up
          </Button>
        </div>
      </div>
    )
  }

  return (
    <EmailVerificationScreen
      email={email}
      onResendEmail={handleResendEmail}
      onVerifyCode={handleVerifyCode}
      onBackToLogin={handleBackToLogin}
      onVerificationComplete={handleVerificationComplete}
      isResending={isResending}
      isVerifying={isVerifying}
      resendCooldown={resendCooldown}
      error={error}
    />
  )
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-primary border-t-transparent mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Loading...</h2>
          <p className="text-text-secondary">
            Setting up email verification...
          </p>
        </div>
      </div>
    }>
      <EmailVerificationContent />
    </Suspense>
  )
}
