'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, SignInRequest } from '@/api/types'
import { authApi, userApi } from '@/api'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken')
        const storedUser = localStorage.getItem('userData')

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(userData)
          
          // Verify token is still valid by fetching user profile
          try {
            await refreshUser()
          } catch (error) {
            // Token is invalid, clear auth state
            clearAuthState()
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        clearAuthState()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const clearAuthState = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
  }

  const login = async (credentials: SignInRequest) => {
    try {
      setIsLoading(true)

      // Clear any existing auth state before login
      clearAuthState()

      const response = await authApi.signIn(credentials)
      
      if (response.success) {
        const { user: userData, token: authToken } = response.data
        
        // Store auth data
        setUser(userData)
        setToken(authToken)
        localStorage.setItem('authToken', authToken)
        localStorage.setItem('userData', JSON.stringify(userData))

        console.log('[Auth] Login successful, stored user data:', userData)
      } else {
        throw new Error('Login failed')
      }
    } catch (error) {
      clearAuthState()
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearAuthState()
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  const refreshUser = async () => {
    if (!token) return

    try {
      const response = await userApi.getProfile()
      if (response.success) {
        setUser(response.data)
        localStorage.setItem('userData', JSON.stringify(response.data))
      } else {
        throw new Error('Failed to refresh user data')
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      throw error
    }
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
