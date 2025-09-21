'use client'

import { ChatbotScreen } from '@/components/screens/ChatbotScreen'
import { useRouter, useSearchParams } from 'next/navigation'
import { LegalDomain } from '@/types'
import { Suspense } from 'react'

function ChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const domain = searchParams.get('domain') as LegalDomain

  const handleBack = () => {
    router.push('/domains')
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="body-regular text-text-secondary mb-4">
            No domain selected. Please select a legal domain first.
          </p>
          <button 
            onClick={() => router.push('/domains')}
            className="text-purple-primary hover:underline"
          >
            Select Domain
          </button>
        </div>
      </div>
    )
  }

  return (
    <ChatbotScreen 
      domain={domain}
      onBack={handleBack}
    />
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="body-regular text-text-secondary">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}