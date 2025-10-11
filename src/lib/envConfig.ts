/**
 * Environment configuration utilities
 * Provides centralized environment detection and backend URL resolution
 */

export interface EnvConfig {
  isDevMode: boolean;
  isProduction: boolean;
  backendUrl: string;
  apiToken: string;
}

/**
 * Get environment configuration based on environment variables
 */
export function getEnvConfig(): EnvConfig {
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
                   process.env.NODE_ENV === 'development';
  
  const isProduction = process.env.NODE_ENV === 'production' && !isDevMode;
  
  // Determine backend URL with priority:
  // 1. Manual override (NEXT_PUBLIC_BACKEND_URL)
  // 2. DEV_MODE setting (localhost:8000)
  // 3. Production URL from env or default
  let backendUrl: string;
  
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  } else if (isDevMode) {
    backendUrl = "http://localhost:8000";
  } else {
    backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://43.217.199.206:8000";
  }
  
  const apiToken = process.env.NEXT_PUBLIC_API_TOKEN || "ragflow-E1YWMxNmU4OTZkNTExZjBiNzUwMDI0Mm";
  
  return {
    isDevMode,
    isProduction,
    backendUrl,
    apiToken,
  };
}

/**
 * Get backend URL for API calls
 */
export function getBackendUrl(): string {
  return getEnvConfig().backendUrl;
}

/**
 * Check if running in development mode
 */
export function isDevMode(): boolean {
  return getEnvConfig().isDevMode;
}

/**
 * Get API token for authentication
 */
export function getApiToken(): string {
  return getEnvConfig().apiToken;
}

/**
 * Log environment configuration (development only)
 */
export function logEnvConfig(): void {
  const config = getEnvConfig();
  
  if (config.isDevMode) {
    console.log("🔧 Environment Configuration:");
    console.log("   Dev Mode:", config.isDevMode);
    console.log("   Production:", config.isProduction);
    console.log("   Backend URL:", config.backendUrl);
    console.log("   API Token:", config.apiToken.substring(0, 10) + "...");
  }
}