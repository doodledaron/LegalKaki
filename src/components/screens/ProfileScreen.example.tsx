'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, Settings, HelpCircle, Shield, LogOut, User as UserIcon, Loader2, AlertTriangle } from 'lucide-react'
import { userApi, authApi, useApiCall, useApiMutation } from '@/api'

interface ProfileScreenProps {
  onBack: () => void
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  // Load user profile from API
  const { 
    data: user, 
    loading: userLoading, 
    error: userError 
  } = useApiCall(() => userApi.getProfile(), [])

  // Sign out mutation
  const { 
    mutate: signOut, 
    loading: signingOut 
  } = useApiMutation(authApi.signOut)

  const profileItems = [
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      description: 'App preferences and notifications',
      action: () => console.log('Settings clicked')
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: 'Help & Support',
      description: 'Get help and contact support',
      action: () => console.log('Help clicked')
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: 'Privacy Policy',
      description: 'Learn about our privacy practices',
      action: () => console.log('Privacy clicked')
    },
    {
      icon: <LogOut className="w-5 h-5" />,
      label: 'Sign Out',
      description: 'Sign out of your account',
      action: async () => {
        const result = await signOut({})
        if (result) {
          console.log('Signed out successfully')
          // Handle post-signout logic (redirect, clear storage, etc.)
        }
      }
    }
  ]

  const handleSignIn = () => {
    // This would typically open a sign-in modal or navigate to sign-in page
    console.log('Sign in clicked')
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-nav">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            size="small"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back
          </Button>
          
          <h1 className="heading-2 mb-2">Profile</h1>
          <p className="body-regular text-text-secondary">
            Manage your account and preferences
          </p>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-6 text-center">
              {/* Loading State */}
              {userLoading && (
                <div className="py-8">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-primary mb-4" />
                  <p className="body-small text-text-secondary">Loading profile...</p>
                </div>
              )}

              {/* Error State */}
              {userError && (
                <div className="py-8">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="heading-3 mb-2 text-red-700">Error Loading Profile</h3>
                  <p className="body-small text-red-600 mb-4">{userError}</p>
                  <Button 
                    variant="secondary" 
                    size="small"
                    onClick={() => window.location.reload()}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* User Profile Data */}
              {!userLoading && !userError && user && (
                <>
                  <div className="w-20 h-20 bg-purple-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-10 h-10 text-purple-primary" />
                    )}
                  </div>
                  <h3 className="heading-3 mb-1">{user.name}</h3>
                  {user.email ? (
                    <p className="body-small text-text-secondary mb-4">
                      {user.email}
                    </p>
                  ) : (
                    <p className="body-small text-text-secondary mb-4">
                      Guest User
                    </p>
                  )}
                  
                  {/* User Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-primary">
                        {user.createdAt ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0}
                      </div>
                      <div className="body-small text-text-secondary">Days Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-success">
                        {user.preferences ? Object.keys(user.preferences).length : 0}
                      </div>
                      <div className="body-small text-text-secondary">Preferences Set</div>
                    </div>
                  </div>

                  {!user.email && (
                    <Button variant="primary" onClick={handleSignIn}>
                      Sign In to Save Progress
                    </Button>
                  )}
                </>
              )}

              {/* Guest State (no user data and not loading) */}
              {!userLoading && !userError && !user && (
                <>
                  <div className="w-20 h-20 bg-purple-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="w-10 h-10 text-purple-primary" />
                  </div>
                  <h3 className="heading-3 mb-1">Guest User</h3>
                  <p className="body-small text-text-secondary mb-4">
                    Sign in to save your progress
                  </p>
                  <Button variant="primary" onClick={handleSignIn}>
                    Sign In
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Menu Items */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {profileItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <Card className="card-interactive cursor-pointer" onClick={item.action}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-text-secondary">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="body-regular font-medium text-text-primary">
                        {item.label}
                      </h4>
                      <p className="body-small text-text-secondary">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-text-secondary">
                      {item.label === 'Sign Out' && signingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* App Info */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="body-small text-text-secondary">
            LegalKaki v1.0.0
          </p>
          <p className="caption text-text-secondary mt-1">
            Making legal information accessible for every rakyat
          </p>
          <p className="caption text-text-secondary mt-2">
            🔗 Powered by Mock API - Ready for Backend Integration
          </p>
        </motion.div>
      </div>
    </div>
  )
}