'use client'

import { CollectionList } from '@/components/screens/CollectionList'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function CollectionsPage() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/')
  }

  const handleSelectCollection = (collectionId: string) => {
    router.push(`/collections/${collectionId}`)
  }

  const handleStartNewChat = () => {
    router.push('/domains')
  }

  return (
    <AuthGuard>
      <CollectionList 
        onBack={handleBack}
        onSelectCollection={handleSelectCollection}
        onStartNewChat={handleStartNewChat}
      />
    </AuthGuard>
  )
}