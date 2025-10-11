'use client'

import { ProfileScreen } from '@/components/screens/ProfileScreen'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function ProfilePage() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/')
  }

  return (
    <AuthGuard>
      <ProfileScreen 
        onBack={handleBack}
      />
    </AuthGuard>
  )
}