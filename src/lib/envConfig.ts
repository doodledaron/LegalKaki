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
  // Use NEXT_PUBLIC_DEV_MODE explicitly, not NODE_ENV
  // This allows controlling backend URL independently of Next.js build mode

  // Log all environment variables for debugging (will show in browser console and build logs)
  const envVars = {
    NEXT_PUBLIC_DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
  console.log('🔧 [EnvConfig] Environment variables:', envVars);

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  console.log('🔧 [EnvConfig] isDevMode calculation:', {
    raw: process.env.NEXT_PUBLIC_DEV_MODE,
    type: typeof process.env.NEXT_PUBLIC_DEV_MODE,
    result: isDevMode,
    comparison: `"${process.env.NEXT_PUBLIC_DEV_MODE}" === "true"`,
  });

  const isProduction = process.env.NODE_ENV === 'production' && !isDevMode;

  // Determine backend URL with priority:
  // 1. Manual override (NEXT_PUBLIC_BACKEND_URL)
  // 2. NEXT_PUBLIC_DEV_MODE=true → localhost:8000
  // 3. Production URL from NEXT_PUBLIC_API_BASE_URL or default
  let backendUrl: string;

  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    console.log('🔧 [EnvConfig] Using NEXT_PUBLIC_BACKEND_URL override:', backendUrl);
  } else if (isDevMode) {
    backendUrl = "http://localhost:8000";
    console.log('🔧 [EnvConfig] Using dev mode (localhost):', backendUrl);
  } else {
    backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://43.217.199.206:8000";
    console.log('🔧 [EnvConfig] Using production URL:', backendUrl);
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