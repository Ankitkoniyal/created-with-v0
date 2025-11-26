// components/superadmin/settings.tsx
"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Save,
  Shield,
  Bell,
  Globe,
  CreditCard,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  AlertTriangle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { clearSettingsCache } from "@/lib/platform-settings"

interface PlatformSettings {
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

const DEFAULT_SETTINGS: PlatformSettings = {
  id: "global",
  site_name: "Marketplace",
  site_description: "Discover and list local deals",
  site_url: "https://marketplace.example.com",
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
  terms_url: "https://marketplace.example.com/terms",
  privacy_url: "https://marketplace.example.com/privacy",
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

export function Settings() {
  const supabase = createClient()
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState<string>("")
  const [restoreError, setRestoreError] = useState<string>("")
  const [restoreSuccess, setRestoreSuccess] = useState(false)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", "global")
        .maybeSingle()

      if (error && error.code !== "PGRST116") throw error

      if (!data) {
        setSettings(DEFAULT_SETTINGS)
      } else {
        setSettings({ ...DEFAULT_SETTINGS, ...data })
      }
    } catch (err) {
      console.error("Failed to load settings", err)
      toast.error("Unable to load platform settings")
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleInputChange = (field: keyof PlatformSettings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Build payload with all settings
      const payload: any = {
        id: "global",
        site_name: settings.site_name.trim() || DEFAULT_SETTINGS.site_name,
        site_description: settings.site_description.trim() || DEFAULT_SETTINGS.site_description,
        site_url: settings.site_url.trim(),
        admin_email: settings.admin_email.trim(),
        support_email: settings.support_email?.trim() || null,
        terms_url: settings.terms_url?.trim() || null,
        privacy_url: settings.privacy_url?.trim() || null,
        currency: settings.currency.trim().toUpperCase(),
        currency_symbol: settings.currency_symbol.trim() || DEFAULT_SETTINGS.currency_symbol,
        enable_notifications: settings.enable_notifications,
        enable_email_verification: settings.enable_email_verification,
        enable_user_registration: settings.enable_user_registration,
        maintenance_mode: settings.maintenance_mode,
        items_per_page: settings.items_per_page,
        max_images_per_ad: settings.max_images_per_ad,
        max_ad_duration: settings.max_ad_duration,
        auto_approve_ads: settings.auto_approve_ads,
        auto_approve_delay_minutes: (() => {
          const value = settings.auto_approve_delay_minutes
          if (value === null || value === undefined || value === "" || (typeof value === 'string' && value.trim() === "")) {
            return null
          }
          const numValue = typeof value === 'number' ? value : parseInt(String(value), 10)
          return isNaN(numValue) || numValue < 0 ? null : numValue
        })(),
        stripe_enabled: settings.stripe_enabled,
        paypal_enabled: settings.paypal_enabled,
      }

      // Add optional fields
      if (settings.require_phone_verification !== undefined) {
        payload.require_phone_verification = settings.require_phone_verification
      }
      if (settings.allow_anonymous_browsing !== undefined) {
        payload.allow_anonymous_browsing = settings.allow_anonymous_browsing
      }
      if (settings.enable_ratings !== undefined) {
        payload.enable_ratings = settings.enable_ratings
      }
      if (settings.enable_comments !== undefined) {
        payload.enable_comments = settings.enable_comments
      }
      if (settings.max_ads_per_user !== undefined) {
        payload.max_ads_per_user = settings.max_ads_per_user
      }
      if (settings.featured_ads_enabled !== undefined) {
        payload.featured_ads_enabled = settings.featured_ads_enabled
      }
      if (settings.featured_ads_price !== undefined) {
        payload.featured_ads_price = settings.featured_ads_price
      }
      if (settings.enable_search_suggestions !== undefined) {
        payload.enable_search_suggestions = settings.enable_search_suggestions
      }
      if (settings.min_price !== undefined) {
        payload.min_price = settings.min_price
      }
      if (settings.max_price !== undefined) {
        payload.max_price = settings.max_price
      }
      if (settings.enable_email_alerts !== undefined) {
        payload.enable_email_alerts = settings.enable_email_alerts
      }
      if (settings.spam_detection_enabled !== undefined) {
        payload.spam_detection_enabled = settings.spam_detection_enabled
      }
      if (settings.auto_delete_expired_ads !== undefined) {
        payload.auto_delete_expired_ads = settings.auto_delete_expired_ads
      }
      if (settings.expired_ads_retention_days !== undefined) {
        payload.expired_ads_retention_days = settings.expired_ads_retention_days
      }

      // Use API route to bypass RLS (uses service role key)
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to save settings")
      }

      // Clear cache so changes take effect immediately
      clearSettingsCache()
      toast.success("Settings saved successfully")
    } catch (err: any) {
      console.error("Failed to save settings", err)
      const errorMessage = err?.message || err?.error?.message || "Failed to save settings. Please check console for details."
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
    toast.info("Settings reverted to defaults locally")
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSettings()
    toast.success("Settings reloaded from server")
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
          <p className="text-sm text-gray-300">Loading platform configuration…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-sm text-gray-400">
            Control global preferences, safety policies, and platform defaults
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              <span>Active - Setting is working</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-yellow-400" />
              <span>Saved but not yet implemented</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} /> Reload
          </Button>
          <Button variant="outline" onClick={resetToDefaults} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
            Restore defaults
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsSection
          icon={Globe}
          title="General"
          description="Basic marketplace identity and contact information"
        >
          <FieldGroup label="Site name">
            <Input
              value={settings.site_name}
              onChange={(e) => handleInputChange("site_name", e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </FieldGroup>
          <FieldGroup label="Site description">
            <Textarea
              value={settings.site_description}
              onChange={(e) => handleInputChange("site_description", e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              rows={2}
            />
          </FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Primary domain">
              <Input
                value={settings.site_url}
                onChange={(e) => handleInputChange("site_url", e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
            <FieldGroup label="Admin contact">
              <Input
                type="email"
                value={settings.admin_email}
                onChange={(e) => handleInputChange("admin_email", e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FieldGroup label="Currency code">
              <Input
                value={settings.currency}
                maxLength={3}
                onChange={(e) => handleInputChange("currency", e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
            <FieldGroup label="Symbol">
              <Input
                value={settings.currency_symbol}
                maxLength={3}
                onChange={(e) => handleInputChange("currency_symbol", e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
            <FieldGroup label="Support email">
              <Input
                value={settings.support_email ?? ""}
                onChange={(e) => handleInputChange("support_email", e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Terms URL">
              <Input
                value={settings.terms_url ?? ""}
                onChange={(e) => handleInputChange("terms_url", e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
            <FieldGroup label="Privacy policy URL">
              <Input
                value={settings.privacy_url ?? ""}
                onChange={(e) => handleInputChange("privacy_url", e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={Shield}
          title="Security & access"
          description="Keep the marketplace safe and compliant"
        >
          <ToggleRow
            label="Require email verification"
            helper="Users must confirm their email before logging in (Supabase Auth setting)"
            checked={settings.enable_email_verification}
            onCheckedChange={(checked) => handleInputChange("enable_email_verification", checked)}
            isActive={false}
          />
          <ToggleRow
            label="Require phone verification"
            helper="Users must verify their phone number"
            checked={settings.require_phone_verification ?? false}
            onCheckedChange={(checked) => handleInputChange("require_phone_verification", checked)}
            isActive={false}
          />
          <ToggleRow
            label="Allow new registrations"
            helper="If disabled, only admins can invite users (Not yet enforced in signup flow)"
            checked={settings.enable_user_registration}
            onCheckedChange={(checked) => handleInputChange("enable_user_registration", checked)}
            isActive={false}
          />
          <ToggleRow
            label="Allow anonymous browsing"
            helper="Non-logged-in users can browse listings (Currently always allowed)"
            checked={settings.allow_anonymous_browsing ?? true}
            onCheckedChange={(checked) => handleInputChange("allow_anonymous_browsing", checked)}
            isActive={false}
          />
          <ToggleRow
            label="Auto approve listings"
            helper="Publish new ads automatically without manual review"
            checked={settings.auto_approve_ads}
            onCheckedChange={(checked) => handleInputChange("auto_approve_ads", checked)}
            isActive={true}
          />
          {settings.auto_approve_ads && (
            <FieldGroup label="Auto-approve delay (minutes)">
              <Input
                type="number"
                min={0}
                max={1440}
                value={settings.auto_approve_delay_minutes === null || settings.auto_approve_delay_minutes === undefined ? "" : String(settings.auto_approve_delay_minutes)}
                onChange={(e) => {
                  const value = e.target.value.trim()
                  if (value === "") {
                    handleInputChange("auto_approve_delay_minutes", null)
                  } else {
                    const numValue = parseInt(value, 10)
                    if (!isNaN(numValue) && numValue >= 0) {
                      handleInputChange("auto_approve_delay_minutes", numValue)
                    }
                  }
                }}
                placeholder="0 = immediate, or enter minutes (e.g., 60 for 1 hour)"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                {settings.auto_approve_delay_minutes 
                  ? `Ads will be auto-approved after ${settings.auto_approve_delay_minutes} minute(s)`
                  : "Ads will be approved immediately when posted"}
              </p>
            </FieldGroup>
          )}
          <ToggleRow
            label="Maintenance mode"
            helper="Show a maintenance notice to visitors (ACTIVE - Works immediately)"
            checked={settings.maintenance_mode}
            onCheckedChange={(checked) => handleInputChange("maintenance_mode", checked)}
            isActive={true}
          />
          <ToggleRow
            label="Spam detection"
            helper="Automatically flag suspicious content"
            checked={settings.spam_detection_enabled ?? true}
            onCheckedChange={(checked) => handleInputChange("spam_detection_enabled", checked)}
            isActive={false}
          />
        </SettingsSection>

        <SettingsSection
          icon={Bell}
          title="Notifications"
          description="Email and system alert preferences"
        >
          <ToggleRow
            label="Enable notifications"
            helper="Send transactional emails for purchases, reports, and account changes"
            checked={settings.enable_notifications}
            onCheckedChange={(checked) => handleInputChange("enable_notifications", checked)}
          />
        </SettingsSection>

        <SettingsSection
          icon={CreditCard}
          title="Payments"
          description="Configure supported payment processors"
        >
          <ToggleRow
            label="Stripe"
            helper="Allow card payments via Stripe"
            checked={settings.stripe_enabled}
            onCheckedChange={(checked) => handleInputChange("stripe_enabled", checked)}
          />
          <ToggleRow
            label="PayPal"
            helper="Allow PayPal checkouts"
            checked={settings.paypal_enabled}
            onCheckedChange={(checked) => handleInputChange("paypal_enabled", checked)}
          />
        </SettingsSection>

        <SettingsSection
          icon={Database}
          title="Content policy"
          description="Control listing limits and catalog behavior"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Items per page">
              <Input
                type="number"
                min={8}
                max={100}
                value={settings.items_per_page}
                onChange={(e) => handleInputChange("items_per_page", Number(e.target.value) || DEFAULT_SETTINGS.items_per_page)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">⚠️ Not yet implemented in product listings</p>
            </FieldGroup>
            <FieldGroup label="Max images per ad">
              <Input
                type="number"
                min={1}
                max={20}
                value={settings.max_images_per_ad}
                onChange={(e) => handleInputChange("max_images_per_ad", Number(e.target.value) || DEFAULT_SETTINGS.max_images_per_ad)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">⚠️ Not yet implemented in upload form</p>
            </FieldGroup>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Max ads per user">
              <Input
                type="number"
                min={1}
                max={500}
                value={settings.max_ads_per_user ?? 50}
                onChange={(e) => handleInputChange("max_ads_per_user", Number(e.target.value) || 50)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
            <FieldGroup label="Listing duration (days)">
              <Input
                type="number"
                min={7}
                max={180}
                value={settings.max_ad_duration}
                onChange={(e) => handleInputChange("max_ad_duration", Number(e.target.value) || DEFAULT_SETTINGS.max_ad_duration)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Min price (optional)">
              <Input
                type="number"
                min={0}
                value={settings.min_price ?? ""}
                onChange={(e) => handleInputChange("min_price", e.target.value ? Number(e.target.value) : null)}
                placeholder="No minimum"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
            <FieldGroup label="Max price (optional)">
              <Input
                type="number"
                min={0}
                value={settings.max_price ?? ""}
                onChange={(e) => handleInputChange("max_price", e.target.value ? Number(e.target.value) : null)}
                placeholder="No maximum"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
          </div>
          <ToggleRow
            label="Auto delete expired ads"
            helper="Automatically remove ads after expiration"
            checked={settings.auto_delete_expired_ads ?? false}
            onCheckedChange={(checked) => handleInputChange("auto_delete_expired_ads", checked)}
            isActive={false}
          />
          {settings.auto_delete_expired_ads && (
            <FieldGroup label="Retention period (days)">
              <Input
                type="number"
                min={1}
                max={365}
                value={settings.expired_ads_retention_days ?? 30}
                onChange={(e) => handleInputChange("expired_ads_retention_days", Number(e.target.value) || 30)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
          )}
        </SettingsSection>

        <SettingsSection
          icon={Server}
          title="Advanced"
          description="Platform-level toggles and automation"
        >
          <p className="text-sm text-gray-400">
            These settings control advanced automations and integrations. Adjust carefully.
          </p>
          <Separator className="my-4 border-gray-700" />
          <ToggleRow
            label="Enable ratings"
            helper="Allow users to rate products and sellers"
            checked={settings.enable_ratings ?? false}
            onCheckedChange={(checked) => handleInputChange("enable_ratings", checked)}
            isActive={false}
            helper="Feature is currently on hold - ratings are disabled by default"
          />
          <ToggleRow
            label="Enable comments"
            helper="Allow users to comment on listings"
            checked={settings.enable_comments ?? true}
            onCheckedChange={(checked) => handleInputChange("enable_comments", checked)}
            isActive={false}
          />
          <ToggleRow
            label="Enable search suggestions"
            helper="Show autocomplete suggestions in search"
            checked={settings.enable_search_suggestions ?? true}
            onCheckedChange={(checked) => handleInputChange("enable_search_suggestions", checked)}
            isActive={false}
          />
          <ToggleRow
            label="Enable email alerts"
            helper="Send email notifications for new listings matching user preferences"
            checked={settings.enable_email_alerts ?? true}
            onCheckedChange={(checked) => handleInputChange("enable_email_alerts", checked)}
            isActive={false}
          />
          <ToggleRow
            label="Featured ads"
            helper="Enable premium featured listing option"
            checked={settings.featured_ads_enabled ?? false}
            onCheckedChange={(checked) => handleInputChange("featured_ads_enabled", checked)}
            isActive={false}
          />
          {settings.featured_ads_enabled && (
            <FieldGroup label="Featured ad price">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={settings.featured_ads_price ?? 9.99}
                onChange={(e) => handleInputChange("featured_ads_price", Number(e.target.value) || 9.99)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </FieldGroup>
          )}
        </SettingsSection>

        <SettingsSection
          icon={Database}
          title="Backup & Restore"
          description="Manage database backups and restore from backup files"
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
              <h4 className="mb-2 text-sm font-medium text-white">Download Backup</h4>
              <p className="mb-3 text-xs text-gray-400">
                Create a complete backup of your database. This includes all users, products, messages, and settings.
              </p>
              <Button
                onClick={async () => {
                  try {
                    const confirmed = confirm(
                      "This will download a full backup of your database. Continue?"
                    )
                    if (!confirmed) return

                    const response = await fetch("/api/admin/backup")
                    
                    if (!response.ok) {
                      const error = await response.json().catch(() => ({ error: "Download failed" }))
                      toast.error(`Backup failed: ${error.error}`)
                      return
                    }

                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `backup-${new Date().toISOString().split("T")[0]}.json`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)

                    toast.success("Backup downloaded successfully!")
                  } catch (error) {
                    console.error("Backup error:", error)
                    toast.error("Failed to download backup")
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </Button>
            </div>

            <Separator className="border-gray-700" />

            <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
              <h4 className="mb-2 text-sm font-medium text-white">Restore from Backup</h4>
              <p className="mb-3 text-xs text-gray-400">
                Upload a backup JSON file to restore your database. ⚠️ This will overwrite existing data.
              </p>

              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block text-xs uppercase tracking-wide text-gray-400">
                    Select Backup File
                  </Label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (!file.name.endsWith(".json")) {
                          toast.error("Please select a JSON file")
                          return
                        }
                        setRestoreFile(file)
                        setRestoreError("")
                        setRestoreSuccess(false)
                      }
                    }}
                    className="cursor-pointer bg-gray-800 border-gray-700 text-white file:mr-4 file:rounded file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
                  />
                  {restoreFile && (
                    <p className="mt-2 text-xs text-gray-400">Selected: {restoreFile.name}</p>
                  )}
                </div>

                {restoreError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Restore Failed</p>
                      <p className="text-xs text-red-300">{restoreError}</p>
                    </div>
                  </div>
                )}

                {restoreSuccess && (
                  <div className="flex items-start gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-400">Restore Successful</p>
                      <p className="text-xs text-green-300">{restoreProgress}</p>
                    </div>
                  </div>
                )}

                {restoreProgress && !restoreError && !restoreSuccess && (
                  <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-3">
                    <p className="text-xs text-blue-300">{restoreProgress}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    onClick={async () => {
                      if (!restoreFile) {
                        toast.error("Please select a backup file")
                        return
                      }

                      const confirmed = confirm(
                        "⚠️ WARNING: This will restore data from the backup file.\n\n" +
                        "Current data may be overwritten. This action cannot be undone.\n\n" +
                        "Do you want to continue?"
                      )

                      if (!confirmed) return

                      setRestoring(true)
                      setRestoreError("")
                      setRestoreSuccess(false)
                      setRestoreProgress("Reading backup file...")

                      try {
                        // Read file
                        const text = await restoreFile.text()
                        let backupData
                        
                        try {
                          backupData = JSON.parse(text)
                        } catch (parseError) {
                          throw new Error("Invalid JSON file. Please ensure this is a valid backup file.")
                        }

                        if (!backupData.data || !backupData.metadata) {
                          throw new Error("Invalid backup format. Missing required data or metadata.")
                        }

                        setRestoreProgress("Uploading backup data...")

                        // Send restore request
                        const response = await fetch("/api/admin/backup/restore", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            backupData,
                            options: {
                              clearExisting: true,
                            },
                          }),
                        })

                        const result = await response.json()

                        if (!response.ok) {
                          throw new Error(result.error || "Restore failed")
                        }

                        setRestoreSuccess(true)
                        setRestoreProgress(
                          result.message || "Restore completed successfully"
                        )
                        
                        if (result.failedTables) {
                          setRestoreError(
                            `Some tables failed to restore: ${result.failedTables.join(", ")}`
                          )
                        }

                        toast.success("Backup restored successfully!")
                        
                        // Clear file input
                        setRestoreFile(null)
                        
                        // Reload settings if restored
                        if (result.results?.platform_settings?.success) {
                          setTimeout(() => {
                            loadSettings()
                          }, 1000)
                        }
                      } catch (error: any) {
                        const errorMessage = error.message || "Failed to restore backup"
                        setRestoreError(errorMessage)
                        toast.error(errorMessage)
                        setRestoreProgress("")
                      } finally {
                        setRestoring(false)
                      }
                    }}
                    disabled={!restoreFile || restoring}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                  >
                    {restoring ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Restore Backup
                      </>
                    )}
                  </Button>
                </div>

                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                  <p className="text-xs text-yellow-400">
                    <strong>Important:</strong> Always create a backup before restoring. 
                    Restoring will overwrite your current database with data from the backup file.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-900/60 p-2 text-emerald-300">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg text-white">{title}</CardTitle>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-gray-400">{label}</Label>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  helper,
  checked,
  onCheckedChange,
  isActive = false,
}: {
  label: string
  helper?: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
  isActive?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded border border-gray-700 bg-gray-900/60 p-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white">{label}</p>
          {isActive ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" title="This setting is actively used" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-400" title="This setting is saved but not yet implemented" />
          )}
        </div>
        {helper && <p className="text-xs text-gray-400">{helper}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:bg-emerald-600" />
    </div>
  )
}