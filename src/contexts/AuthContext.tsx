'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, SignInRequest } from '@/api/types'
import { mockUser } from '@/api/mockData'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: SignInRequest) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// POC Mode: Authentication is bypassed - always returns authenticated mock user
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User | null>(mockUser)
  const [token] = useState<string | null>('mock-token-poc-version')
  const [isLoading, setIsLoading] = useState(false) // No loading in POC mode

  // Always authenticated in POC mode
  const isAuthenticated = true

  // Initialize auth state immediately with mock user
  useEffect(() => {
    // Set loading to false immediately since we're using mock data
    setIsLoading(false)
    console.log('[Auth POC] Using mock user - authentication bypassed')
  }, [])

  // Placeholder login function (not used in POC)
  const login = async (credentials: SignInRequest) => {
    console.log('[Auth POC] Login called but bypassed in POC mode', credentials)
    // Do nothing in POC mode - already authenticated
    return Promise.resolve()
  }

  // Placeholder logout function (redirects to domains instead)
  const logout = () => {
    console.log('[Auth POC] Logout called but bypassed in POC mode')
    // Redirect to domains page instead of login
    if (typeof window !== 'undefined') {
      window.location.href = '/domains'
    }
  }

  // Placeholder refresh function (not needed in POC)
  const refreshUser = async () => {
    console.log('[Auth POC] Refresh user called but bypassed in POC mode')
    // Do nothing in POC mode
    return Promise.resolve()
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
