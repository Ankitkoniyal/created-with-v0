// lib/platform-settings-server.ts
// Server-only utilities for platform settings
// This file should NEVER be imported by client components

import "server-only" // This will throw an error if imported in client components
import { createClient } from "@/lib/supabase/server"
import type { PlatformSettings } from "./platform-settings"

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
  auto_approve_delay_minutes: null,
  stripe_enabled: false,
  paypal_enabled: false,
  support_email: "support@marketplace.example.com",
  terms_url: null,
  privacy_url: null,
  // New defaults
  require_phone_verification: false,
  allow_anonymous_browsing: true,
  enable_ratings: true,
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

/**
 * Get platform settings (server-side)
 * For use in API routes, server components, and middleware
 */
export async function getPlatformSettingsServer(): Promise<PlatformSettings> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.warn("Failed to fetch platform settings (server):", error)
      return { ...DEFAULT_SETTINGS } as PlatformSettings
    }

    return data
      ? ({ ...DEFAULT_SETTINGS, ...data } as PlatformSettings)
      : ({ ...DEFAULT_SETTINGS } as PlatformSettings)
  } catch (error) {
    console.error("Error fetching platform settings (server):", error)
    return { ...DEFAULT_SETTINGS } as PlatformSettings
  }
}

/**
 * Check if maintenance mode is enabled (server component/API route)
 * Use this in Server Components and API routes, not middleware
 */
export async function isMaintenanceModeServer(): Promise<boolean> {
  const settings = await getPlatformSettingsServer()
  return settings.maintenance_mode ?? false
}

/**
 * Check if user registration is enabled (server-side)
 */
export async function isUserRegistrationEnabled(): Promise<boolean> {
  const settings = await getPlatformSettingsServer()
  return settings.enable_user_registration ?? true
}

/**
 * Check if ads should be auto-approved (server-side)
 */
export async function shouldAutoApproveAds(): Promise<boolean> {
  const settings = await getPlatformSettingsServer()
  return settings.auto_approve_ads ?? false
}

/**
 * Get items per page setting (server-side)
 */
export async function getItemsPerPage(): Promise<number> {
  const settings = await getPlatformSettingsServer()
  return settings.items_per_page ?? 24
}

/**
 * Get max images per ad setting (server-side)
 */
export async function getMaxImagesPerAd(): Promise<number> {
  const settings = await getPlatformSettingsServer()
  return settings.max_images_per_ad ?? 8
}

