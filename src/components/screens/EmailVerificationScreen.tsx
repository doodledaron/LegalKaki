'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Mail, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Key } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface EmailVerificationScreenProps {
  email: string
  onResendEmail: () => Promise<void>
  onVerifyCode: (code: string) => Promise<void>
  onBackToLogin: () => void
  onVerificationComplete: () => void
  isResending?: boolean
  isVerifying?: boolean
  resendCooldown?: number
  error?: string
}

export function EmailVerificationScreen({ 
  email, 
  onResendEmail, 
  onVerifyCode,
  onBackToLogin, 
  onVerificationComplete,
  isResending = false,
  isVerifying = false,
  resendCooldown = 60,
  error
}: EmailVerificationScreenProps) {
  const [countdown, setCountdown] = useState(resendCooldown)
  const [canResend, setCanResend] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending')

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleResendEmail = async () => {
    if (!canResend || isResending) return
    
    try {
      await onResendEmail()
      setCountdown(resendCooldown)
      setCanResend(false)
    } catch (error) {
      console.error('Failed to resend email:', error)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationCode.trim()) return
    
    try {
      await onVerifyCode(verificationCode.trim())
    } catch (error) {
      console.error('Verification failed:', error)
    }
  }

  const handleCodeChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 6)
    setVerificationCode(sanitizedValue)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-gray-50 to-purple-subtle/30" />
      
      {/* Floating Purple Orbs */}
      <motion.div 
        className="absolute top-20 right-10 w-40 h-40 rounded-full bg-purple-primary/20 blur-2xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.6, 0.9, 0.6],
          x: [0, 40, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-32 left-10 w-36 h-36 rounded-full bg-purple-light/25 blur-xl"
        animate={{
          scale: [1.2, 0.8, 1.2],
          opacity: [0.7, 1, 0.7],
          x: [0, -30, 0],
          y: [0, 25, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      />

      {/* Main Content */}
      <motion.div 
        className="relative z-10 w-full max-w-md mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Card className="backdrop-blur-sm bg-surface-white/95 border-purple-subtle shadow-xl">
          <CardHeader className="text-center pb-4">
            <motion.div
              className="mx-auto mb-4 w-16 h-16 rounded-full bg-purple-subtle flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Mail className="w-8 h-8 text-purple-primary" />
            </motion.div>
            
            <CardTitle className="text-2xl font-bold text-text-primary mb-2">
              Check Your Email
            </CardTitle>
            
            <p className="text-text-secondary text-sm leading-relaxed">
              We&apos;ve sent a verification link to
            </p>
            
            <motion.div
              className="mt-2 px-3 py-2 bg-purple-subtle rounded-lg border border-purple-primary/20"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-purple-primary font-medium text-sm break-all">
                {email}
              </p>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Verification Code Input */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-center">
                <p className="text-text-secondary text-sm mb-4">
                  Enter the 6-digit verification code sent to your email
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="000000"
                    leftIcon={<Key className="w-4 h-4" />}
                    error={error}
                    disabled={isVerifying}
                    className="text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-text-secondary text-center">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isVerifying}
                  disabled={verificationCode.length !== 6 || isVerifying}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Email'}
                </Button>
              </form>
            </motion.div>

            {/* Resend Section */}
            <motion.div
              className="pt-4 border-t border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-text-secondary text-sm text-center mb-4">
                Didn&apos;t receive the email?
              </p>
              
              <Button
                variant="secondary"
                fullWidth
                onClick={handleResendEmail}
                disabled={!canResend || isResending}
                loading={isResending}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                {canResend ? 'Resend Email' : `Resend in ${formatTime(countdown)}`}
              </Button>
            </motion.div>

            {/* Back to Login */}
            <motion.div
              className="pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <Button
                variant="ghost"
                fullWidth
                onClick={onBackToLogin}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Login
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        {/* Status Messages */}
        <motion.div
          className="mt-6 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {verificationStatus === 'verified' && (
            <div className="flex items-center justify-center space-x-2 text-success">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Email verified successfully!</span>
            </div>
          )}
          
          {verificationStatus === 'failed' && (
            <div className="flex items-center justify-center space-x-2 text-error">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Verification failed. Please try again.</span>
            </div>
          )}
        </motion.div>

        {/* Bottom Brand */}
        <motion.div 
          className="absolute bottom-8 left-0 right-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <p className="text-text-secondary text-sm">
            LegalKaki - AI Legal Assistant
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
