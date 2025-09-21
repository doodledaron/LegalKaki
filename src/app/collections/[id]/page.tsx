'use client'

import { CollectionDashboard } from '@/components/screens/CollectionDashboard'
import { useRouter, useParams } from 'next/navigation'

export default function CollectionPage() {
  const router = useRouter()
  const params = useParams()
  const collectionId = params.id as string

  const handleBack = () => {
    router.push('/collections')
  }

  const handleStartNewChat = () => {
    router.push('/domains')
  }

  if (!collectionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="body-regular text-text-secondary mb-4">
            Collection not found.
          </p>
          <button 
            onClick={() => router.push('/collections')}
            className="text-purple-primary hover:underline"
          >
            Back to Collections
          </button>
        </div>
      </div>
    )
  }

  return (
    <CollectionDashboard 
      collectionId={collectionId}
      onBack={handleBack}
      onStartNewChat={handleStartNewChat}
    />
  )
}