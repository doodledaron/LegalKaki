'use client'

import { DomainSelectionScreen } from '@/components/screens/DomainSelectionScreen'
import { useRouter } from 'next/navigation'
import { LegalDomain } from '@/types'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function DomainsPage() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/')
  }

  const handleDomainSelect = (domain: LegalDomain) => {
    router.push(`/chat?domain=${domain}`)
  }

  const handleUnsure = () => {
    router.push('/chat?domain=general')
  }

  return (
    <AuthGuard>
      <DomainSelectionScreen 
        onBack={handleBack}
        onDomainSelect={handleDomainSelect}
        onUnsure={handleUnsure}
      />
    </AuthGuard>
  )
}