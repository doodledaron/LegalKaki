'use client'

import { ProfileScreen } from '@/components/screens/ProfileScreen'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/')
  }

  return (
    <ProfileScreen 
      onBack={handleBack}
    />
  )
}