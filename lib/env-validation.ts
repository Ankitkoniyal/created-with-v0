// Environment variable validation
// Run this on app startup to ensure all required env vars are set

interface EnvConfig {
  required: string[]
  optional: string[]
  warnings?: Record<string, string>
}

const ENV_CONFIG: EnvConfig = {
  required: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  optional: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'CRON_SECRET',
    'SENTRY_DSN',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPER_ADMIN_EMAILS',
  ],
  warnings: {
    SUPABASE_SERVICE_ROLE_KEY: 'Service role key is required for admin operations',
    CRON_SECRET: 'Cron secret is recommended for production cron jobs',
    SENTRY_DSN: 'Sentry DSN is recommended for error tracking in production',
  },
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required variables
  for (const key of ENV_CONFIG.required) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}`)
    }
  }

  // Check optional but recommended variables
  for (const [key, message] of Object.entries(ENV_CONFIG.warnings || {})) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      warnings.push(`${key}: ${message}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate environment variables and log results
 * Call this in your app initialization
 */
export function validateAndLogEnvironment(): ValidationResult {
  const result = validateEnvironment()

  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:')
    result.errors.forEach((error) => {
      console.error(`  - ${error}`)
    })
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Environment warnings:')
    result.warnings.forEach((warning) => {
      console.warn(`  - ${warning}`)
    })
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ Environment variables validated')
  }

  return result
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key]
  if (!value && !fallback) {
    throw new Error(`Environment variable ${key} is required but not set`)
  }
  return value || fallback || ''
}

