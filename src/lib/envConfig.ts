/**
 * Environment configuration utilities
 * Provides centralized environment detection and backend URL resolution
 *
 * POC Mode: When NEXT_PUBLIC_POC_MODE=true, the application runs entirely
 * on mock data and localStorage, with no backend or AWS dependencies.
 */

export interface EnvConfig {
  isPOCMode: boolean; // POC Mode: No backend, no AWS, only mock data
  isDevMode: boolean;
  isProduction: boolean;
  backendUrl: string;
  apiToken: string;
}

/**
 * Get environment configuration based on environment variables
 */
export function getEnvConfig(): EnvConfig {
  // Check POC Mode first (highest priority)
  const isPOCMode = process.env.NEXT_PUBLIC_POC_MODE === 'true';

  // Use NEXT_PUBLIC_DEV_MODE explicitly, not NODE_ENV
  // This allows controlling backend URL independently of Next.js build mode

  // Log all environment variables for debugging (will show in browser console and build logs)
  const envVars = {
    NEXT_PUBLIC_POC_MODE: process.env.NEXT_PUBLIC_POC_MODE,
    NEXT_PUBLIC_DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  if (isPOCMode) {
    console.log('🎯 [POC MODE] Running in POC mode - using mock data only');
    console.log('🔧 [EnvConfig] Environment variables:', envVars);
  } else {
    console.log('🔧 [EnvConfig] Environment variables:', envVars);
  }

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  console.log('🔧 [EnvConfig] isDevMode calculation:', {
    raw: process.env.NEXT_PUBLIC_DEV_MODE,
    type: typeof process.env.NEXT_PUBLIC_DEV_MODE,
    result: isDevMode,
    comparison: `"${process.env.NEXT_PUBLIC_DEV_MODE}" === "true"`,
  });

  const isProduction = process.env.NODE_ENV === 'production' && !isDevMode && !isPOCMode;

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
    // In production, use proxy to avoid mixed content issues (HTTPS -> HTTP)
    // Check if we're in browser and on HTTPS
    const isBrowser = typeof window !== 'undefined';
    const isHttps = isBrowser && window.location.protocol === 'https:';

    if (isHttps) {
      // Use Next.js API proxy to avoid mixed content
      backendUrl = '/api/proxy';
      console.log('🔧 [EnvConfig] Using HTTPS proxy to avoid mixed content:', backendUrl);
    } else {
      // Direct connection (local dev or HTTP deployment)
      backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://43.217.199.206:8000";
      console.log('🔧 [EnvConfig] Using direct backend URL:', backendUrl);
    }
  }
  
  const apiToken = isPOCMode
    ? 'mock-token-poc-version'
    : (process.env.NEXT_PUBLIC_API_TOKEN || "ragflow-E1YWMxNmU4OTZkNTExZjBiNzUwMDI0Mm");

  return {
    isPOCMode,
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
 * Check if running in POC mode (mock data only)
 */
export function isPOCMode(): boolean {
  return getEnvConfig().isPOCMode;
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

  if (config.isPOCMode || config.isDevMode) {
    console.log("🔧 Environment Configuration:");
    console.log("   POC Mode:", config.isPOCMode);
    console.log("   Dev Mode:", config.isDevMode);
    console.log("   Production:", config.isProduction);
    console.log("   Backend URL:", config.backendUrl);
    console.log("   API Token:", config.apiToken.substring(0, 10) + "...");

    if (config.isPOCMode) {
      console.log("🎯 POC MODE ACTIVE - Using mock data and localStorage only");
      console.log("   → No backend API calls will be made");
      console.log("   → No AWS services will be used");
      console.log("   → All data stored in browser localStorage");
    }
  }
}