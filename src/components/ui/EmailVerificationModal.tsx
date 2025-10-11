'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, X, Mail, RefreshCw, Key } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface EmailVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  status: 'pending' | 'verified' | 'failed' | 'expired'
  onResendEmail?: () => Promise<void>
  onVerifyCode?: (code: string) => Promise<void>
  isResending?: boolean
  isVerifying?: boolean
  resendCooldown?: number
  autoClose?: boolean
  autoCloseDelay?: number
  error?: string
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  status,
  onResendEmail,
  onVerifyCode,
  isResending = false,
  isVerifying = false,
  resendCooldown = 60,
  autoClose = false,
  autoCloseDelay = 3000,
  error
}: EmailVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState('')
  
  // Auto close for successful verification
  useEffect(() => {
    if (autoClose && status === 'verified' && isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      
      return () => clearTimeout(timer)
    }
  }, [autoClose, status, isOpen, autoCloseDelay, onClose])

  // Reset verification code when modal opens
  useEffect(() => {
    if (isOpen) {
      setVerificationCode('')
    }
  }, [isOpen])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationCode.trim() || !onVerifyCode) return
    
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

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          iconColor: 'text-success',
          iconBg: 'bg-success/10',
          title: 'Email Verified!',
          description: 'Your email has been successfully verified.',
          showEmail: false,
          showResend: false,
          showCodeInput: false
        }
      case 'failed':
        return {
          icon: AlertCircle,
          iconColor: 'text-error',
          iconBg: 'bg-error/10',
          title: 'Verification Failed',
          description: 'The verification code is invalid or has expired.',
          showEmail: true,
          showResend: true,
          showCodeInput: true
        }
      case 'expired':
        return {
          icon: AlertCircle,
          iconColor: 'text-warning',
          iconBg: 'bg-warning/10',
          title: 'Code Expired',
          description: 'The verification code has expired. Please request a new one.',
          showEmail: true,
          showResend: true,
          showCodeInput: true
        }
      default:
        return {
          icon: Mail,
          iconColor: 'text-purple-primary',
          iconBg: 'bg-purple-subtle',
          title: 'Check Your Email',
          description: 'We\'ve sent a 6-digit verification code to your email address.',
          showEmail: true,
          showResend: true,
          showCodeInput: true
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.icon

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Card className="backdrop-blur-sm bg-surface-white/95 border-gray-200 shadow-2xl">
            <CardHeader className="text-center pb-4 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>

              {/* Icon */}
              <motion.div
                className={`mx-auto mb-4 w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
              </motion.div>
              
              <CardTitle className="text-xl font-bold text-text-primary mb-2">
                {config.title}
              </CardTitle>
              
              <motion.p
                className="text-text-secondary text-sm leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {config.description}
              </motion.p>

              {/* Email Display */}
              {config.showEmail && (
                <motion.div
                  className="mt-3 px-3 py-2 bg-purple-subtle rounded-lg border border-purple-primary/20"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-purple-primary font-medium text-sm break-all">
                    {email}
                  </p>
                </motion.div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Verification Code Input */}
              {config.showCodeInput && onVerifyCode && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-center">
                    <p className="text-text-secondary text-sm mb-3">
                      Enter the 6-digit verification code
                    </p>
                  </div>

                  <form onSubmit={handleVerifyCode} className="space-y-3">
                    <Input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="000000"
                      leftIcon={<Key className="w-4 h-4" />}
                      error={error}
                      disabled={isVerifying}
                      className="text-center text-xl font-mono tracking-widest"
                      maxLength={6}
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={isVerifying}
                      disabled={verificationCode.length !== 6 || isVerifying}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Code'}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* Status-specific content */}
              {status === 'verified' && (
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-success font-medium text-sm mb-4">
                    You can now access all features of LegalKaki!
                  </p>
                  
                  {autoClose && (
                    <p className="text-text-secondary text-xs">
                      This dialog will close automatically...
                    </p>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                className="flex flex-col space-y-3 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {config.showResend && onResendEmail && !config.showCodeInput && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={onResendEmail}
                    disabled={isResending}
                    loading={isResending}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </Button>
                )}

                <Button
                  variant={status === 'verified' ? 'primary' : 'ghost'}
                  fullWidth
                  onClick={onClose}
                >
                  {status === 'verified' ? 'Continue' : 'Close'}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
