/**
 * Authentication utility functions
 */

import { DEFAULT_USER_ID } from "./constants";

/**
 * Get the current authenticated user ID
 * This function should be called from components that have access to the auth context
 *
 * @returns The authenticated user's ID (cognito_sub) or default user ID for testing
 */
export function getUserId(): string {
  // Check if running in browser
  if (typeof window === 'undefined') {
    console.warn('[Auth] getUserId called on server side, using default:', DEFAULT_USER_ID);
    return DEFAULT_USER_ID;
  }

  try {
    // Get user data from localStorage (set by AuthContext)
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      const userId = user.id || user.cognito_sub || user.sub || DEFAULT_USER_ID;
      console.log('🔐 [Auth] getUserId:', userId);
      console.log('👤 [Auth] User data:', { id: user.id, cognito_sub: user.cognito_sub, email: user.email, name: user.name });
      return userId;
    } else {
      console.warn('⚠️ [Auth] No userData in localStorage');
    }
  } catch (error) {
    console.error('❌ [Auth] Failed to get user ID from localStorage:', error);
  }

  // Fallback to default user ID for development/testing
  console.warn('[Auth] No user data found in localStorage, using default:', DEFAULT_USER_ID);
  return DEFAULT_USER_ID;
}

/**
 * Get the current authenticated user's email
 *
 * @returns The authenticated user's email or null
 */
export function getUserEmail(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      return user.email || null;
    }
  } catch (error) {
    console.error('[Auth] Failed to get user email from localStorage:', error);
  }

  return null;
}

/**
 * Get the current auth token
 *
 * @returns The auth token or null
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.error('[Auth] Failed to get auth token from localStorage:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 *
 * @returns True if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
