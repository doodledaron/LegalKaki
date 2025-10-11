'use client'

import { useRouter } from 'next/navigation'

export default function TestVerificationPage() {
  const router = useRouter()

  const testEmails = [
    'test@example.com',
    'user@legalkaki.com',
    'demo@test.com'
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-text-primary text-center mb-8">
          Test Email Verification
        </h1>
        
        <div className="space-y-3">
          <p className="text-text-secondary text-center mb-6">
            Choose a test email to verify:
          </p>
          
          {testEmails.map((email) => (
            <button
              key={email}
              onClick={() => {
                // Set email in localStorage for testing
                localStorage.setItem('pendingVerificationEmail', email)
                router.push(`/verify-email?email=${encodeURIComponent(email)}`)
              }}
              className="w-full p-4 bg-surface-white rounded-lg border border-gray-200 hover:border-purple-primary transition-colors text-left"
            >
              <div className="font-medium text-text-primary">{email}</div>
              <div className="text-sm text-text-secondary">Click to test verification</div>
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-purple-subtle rounded-lg">
          <h3 className="font-semibold text-text-primary mb-2">Testing Instructions:</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Click any email above to test the verification flow</li>
            <li>• The verification page will load with the selected email</li>
            <li>• You can test the 6-digit code input (enter any 6 digits)</li>
            <li>• Use the "Back to Login" button to return here</li>
          </ul>
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full mt-4 p-3 bg-purple-primary text-white rounded-lg hover:bg-purple-dark transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
