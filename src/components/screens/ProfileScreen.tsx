'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, Settings, HelpCircle, Shield, LogOut, User as UserIcon } from 'lucide-react'

interface ProfileScreenProps {
  onBack: () => void
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
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
      action: () => console.log('Sign out clicked')
    }
  ]

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
              <div className="w-20 h-20 bg-purple-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-10 h-10 text-purple-primary" />
              </div>
              <h3 className="heading-3 mb-1">Guest User</h3>
              <p className="body-small text-text-secondary">
                Sign in to save your progress
              </p>
              <Button variant="primary" className="mt-4">
                Sign In
              </Button>
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
                      <ArrowLeft className="w-4 h-4 rotate-180" />
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
        </motion.div>
      </div>
    </div>
  )
}
