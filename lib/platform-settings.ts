// lib/platform-settings.ts
// Utility functions to fetch and use platform settings across the application

import { createClient } from "@/lib/supabase/client"
// Note: Server client is imported dynamically to avoid "next/headers" in client components

export interface PlatformSettings {
  id: string
  site_name: string
  site_description: string
  site_url: string
  admin_email: string
  enable_notifications: boolean
  enable_email_verification: boolean
  enable_user_registration: boolean
  maintenance_mode: boolean
  currency: string
  currency_symbol: string
  items_per_page: number
  max_images_per_ad: number
  max_ad_duration: number
  auto_approve_ads: boolean
  auto_approve_delay_minutes?: number | null
  stripe_enabled: boolean
  paypal_enabled: boolean
  support_email: string | null
  terms_url: string | null
  privacy_url: string | null
  // New recommended settings
  require_phone_verification?: boolean
  allow_anonymous_browsing?: boolean
  enable_ratings?: boolean
  enable_comments?: boolean
  max_ads_per_user?: number
  featured_ads_enabled?: boolean
  featured_ads_price?: number
  enable_search_suggestions?: boolean
  min_price?: number | null
  max_price?: number | null
  enable_email_alerts?: boolean
  spam_detection_enabled?: boolean
  auto_delete_expired_ads?: boolean
  expired_ads_retention_days?: number
  created_at?: string
  updated_at?: string
}

const DEFAULT_SETTINGS: Partial<PlatformSettings> = {
  id: "global",
  site_name: "Marketplace",
  site_description: "Discover and list local deals",
  site_url: process.env.NEXT_PUBLIC_SITE_URL || "https://marketplace.example.com",
  admin_email: "admin@marketplace.example.com",
  enable_notifications: true,
  enable_email_verification: true,
  enable_user_registration: true,
  maintenance_mode: false,
  currency: "USD",
  currency_symbol: "$",
  items_per_page: 24,
  max_images_per_ad: 8,
  max_ad_duration: 30,
  auto_approve_ads: false,
  stripe_enabled: false,
  paypal_enabled: false,
  support_email: "support@marketplace.example.com",
  terms_url: null,
  privacy_url: null,
  // New defaults
  require_phone_verification: false,
  allow_anonymous_browsing: true,
  enable_ratings: false, // Disabled by default - feature on hold
  enable_comments: true,
  max_ads_per_user: 50,
  featured_ads_enabled: false,
  featured_ads_price: 9.99,
  enable_search_suggestions: true,
  min_price: null,
  max_price: null,
  enable_email_alerts: true,
  spam_detection_enabled: true,
  auto_delete_expired_ads: false,
  expired_ads_retention_days: 30,
}

// Client-side cache (browser only)
let clientSettingsCache: PlatformSettings | null = null
let clientCacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get platform settings (client-side)
 * Uses cache to avoid repeated database calls
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  // Return cached settings if still valid
  if (clientSettingsCache && Date.now() - clientCacheTimestamp < CACHE_DURATION) {
    return clientSettingsCache
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.warn("Failed to fetch platform settings:", error)
      return { ...DEFAULT_SETTINGS } as PlatformSettings
    }

    const settings = data
      ? ({ ...DEFAULT_SETTINGS, ...data } as PlatformSettings)
      : ({ ...DEFAULT_SETTINGS } as PlatformSettings)

    // Update cache
    clientSettingsCache = settings
    clientCacheTimestamp = Date.now()

    return settings
  } catch (error) {
    console.error("Error fetching platform settings:", error)
    return { ...DEFAULT_SETTINGS } as PlatformSettings
  }
}

// Server-side functions moved to lib/platform-settings-server.ts
// Import from there in server components, API routes, etc.

/**
 * Clear the client-side cache (useful after updating settings)
 */
export function clearSettingsCache() {
  clientSettingsCache = null
  clientCacheTimestamp = 0
}

/**
 * Check if maintenance mode is enabled (middleware-compatible)
 * Uses direct Supabase query without requiring next/headers
 */
export async function isMaintenanceMode(): Promise<boolean> {
  try {
    // For middleware, use direct Supabase query with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return false // Fail open if env vars not available
    }

    // Direct fetch to Supabase REST API (works in Edge Runtime)
    const response = await fetch(
      `${supabaseUrl}/rest/v1/platform_settings?id=eq.global&select=maintenance_mode`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      return false // Fail open
    }

    const data = await response.json()
    if (data && data.length > 0 && data[0].maintenance_mode) {
      return true
    }

    return false
  } catch (error) {
    console.warn("Failed to check maintenance mode:", error)
    return false // Fail open
  }
}

// Server-side functions moved to lib/platform-settings-server.ts
// Import from there in server components, API routes, etc.
// Example: import { getPlatformSettingsServer } from "@/lib/platform-settings-server"

