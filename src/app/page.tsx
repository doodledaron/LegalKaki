'use client'

import { useState } from 'react'
import { WelcomeScreen } from '@/components/screens/WelcomeScreen'
import { DomainSelectionScreen } from '@/components/screens/DomainSelectionScreen'
import { ChatbotScreen } from '@/components/screens/ChatbotScreen'
import { CollectionList } from '@/components/screens/CollectionList'
import { CollectionDashboard } from '@/components/screens/CollectionDashboard'
import { ProfileScreen } from '@/components/screens/ProfileScreen'
import { SideNavigation } from '@/components/layout/SideNavigation'
import { LegalDomain } from '@/types'

type AppScreen = 'welcome' | 'domain-selection' | 'chat' | 'collection-list' | 'collection-dashboard' | 'profile'

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome')
  const [selectedDomain, setSelectedDomain] = useState<LegalDomain | null>(null)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)

  const handleGetStarted = () => {
    setCurrentScreen('domain-selection')
  }

  const handleBack = () => {
    if (currentScreen === 'domain-selection') {
      setCurrentScreen('welcome')
    } else if (currentScreen === 'chat') {
      setCurrentScreen('domain-selection')
    } else if (currentScreen === 'collection-list') {
      setCurrentScreen('welcome')
    } else if (currentScreen === 'collection-dashboard') {
      setCurrentScreen('collection-list')
      setSelectedCollectionId(null)
    } else if (currentScreen === 'profile') {
      setCurrentScreen('welcome')
    }
  }

  const handleDomainSelect = (domain: LegalDomain) => {
    setSelectedDomain(domain)
    setCurrentScreen('chat')
  }

  const handleUnsure = () => {
    setSelectedDomain('general')
    setCurrentScreen('chat')
  }

  const handleStartNewChat = () => {
    setCurrentScreen('domain-selection')
  }

  const handleViewCollection = () => {
    setCurrentScreen('collection-list')
  }

  const handleSelectCollection = (collectionId: string) => {
    setSelectedCollectionId(collectionId)
    setCurrentScreen('collection-dashboard')
  }

  const handleSideNavigation = (screen: string) => {
    if (screen === 'collection') {
      setCurrentScreen('collection-list')
    } else {
      setCurrentScreen(screen as AppScreen)
    }
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={handleGetStarted} onViewCollection={handleViewCollection} />
      
      case 'domain-selection':
        return (
          <DomainSelectionScreen 
            onBack={handleBack}
            onDomainSelect={handleDomainSelect}
            onUnsure={handleUnsure}
          />
        )
      
      case 'chat':
        return selectedDomain ? (
          <ChatbotScreen 
            domain={selectedDomain}
            onBack={handleBack}
          />
        ) : (
          <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="text-center">
              <p className="body-regular text-text-secondary">
                No domain selected. Please go back and select a domain.
              </p>
            </div>
          </div>
        )
      
      case 'collection-list':
        return (
          <CollectionList 
            onBack={handleBack}
            onSelectCollection={handleSelectCollection}
            onStartNewChat={handleStartNewChat}
          />
        )

      case 'collection-dashboard':
        return selectedCollectionId ? (
          <CollectionDashboard 
            collectionId={selectedCollectionId}
            onBack={handleBack}
            onStartNewChat={handleStartNewChat}
          />
        ) : (
          <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="text-center">
              <p className="body-regular text-text-secondary">
                No collection selected. Please go back and select a collection.
              </p>
            </div>
          </div>
        )

      case 'profile':
        return (
          <ProfileScreen 
            onBack={handleBack}
          />
        )
      
      default:
        return <WelcomeScreen onGetStarted={handleGetStarted} onViewCollection={handleViewCollection} />
    }
  }

  return (
    <div className="h-full flex">
      <SideNavigation 
        activeRoute={currentScreen === 'collection-list' || currentScreen === 'collection-dashboard' ? 'collection' : currentScreen}
        onNavigate={handleSideNavigation}
      />
      <div className="flex-1 overflow-hidden">
        {renderScreen()}
      </div>
    </div>
  )
}
