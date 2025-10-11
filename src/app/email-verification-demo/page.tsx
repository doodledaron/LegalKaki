'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmailVerificationModal } from '@/components/ui/EmailVerificationModal'
import { authApi } from '@/api'

export default function EmailVerificationDemoPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStatus, setModalStatus] = useState<'pending' | 'verified' | 'failed' | 'expired'>('pending')
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const demoEmail = 'user@example.com'

  const handleResendEmail = async () => {
    setIsResending(true)
    setError(undefined)
    
    try {
      // Call the resend code API
      const response = await authApi.resendCode({
        email: demoEmail,
      })
      
      if (response.success) {
        console.log('Verification code resent successfully')
      } else {
        setError('Failed to resend verification code')
      }
    } catch (error) {
      console.error('Failed to resend code:', error)
      setError('Failed to resend verification code')
    } finally {
      setIsResending(false)
    }
  }

  const handleVerifyCode = async (code: string) => {
    setIsVerifying(true)
    setError(undefined)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // For demo purposes, accept any 6-digit code
    if (code.length === 6) {
      setModalStatus('verified')
      setTimeout(() => setModalOpen(false), 3000)
    } else {
      setError('Invalid verification code. Please try again.')
    }
    
    setIsVerifying(false)
  }

  const openModal = (status: typeof modalStatus) => {
    setModalStatus(status)
    setError(undefined)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-text-primary text-center mb-8">
          Email Verification Modal Demo
        </h1>
        
        <div className="space-y-4">
          <Button
            variant="primary"
            fullWidth
            onClick={() => openModal('pending')}
          >
            Show Pending Verification Modal
          </Button>
          
          <Button
            variant="primary"
            fullWidth
            onClick={() => openModal('verified')}
          >
            Show Verified Modal
          </Button>
          
          <Button
            variant="primary"
            fullWidth
            onClick={() => openModal('failed')}
          >
            Show Failed Verification Modal
          </Button>
          
          <Button
            variant="primary"
            fullWidth
            onClick={() => openModal('expired')}
          >
            Show Expired Link Modal
          </Button>
        </div>

        <div className="mt-8 p-4 bg-purple-subtle rounded-lg">
          <h3 className="font-semibold text-text-primary mb-2">Usage Instructions:</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Click any button above to see different modal states</li>
            <li>• The "Pending" modal shows verification code input</li>
            <li>• Enter any 6-digit code to test verification</li>
            <li>• The "Verified" modal auto-closes after 3 seconds</li>
            <li>• All modals are responsive and follow LegalKaki theme</li>
          </ul>
        </div>
      </div>

      <EmailVerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        email={demoEmail}
        status={modalStatus}
        onResendEmail={handleResendEmail}
        onVerifyCode={handleVerifyCode}
        isResending={isResending}
        isVerifying={isVerifying}
        autoClose={modalStatus === 'verified'}
        autoCloseDelay={3000}
        error={error}
      />
    </div>
  )
}
