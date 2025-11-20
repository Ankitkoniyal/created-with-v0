"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bell, Trash2, AlertTriangle, Loader2, CheckCircle } from "lucide-react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [notifications, setNotifications] = useState({
    emailMessages: true,
    emailOffers: false,
    smsMessages: false,
    pushNotifications: true,
    weeklyDigest: true,
  })
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [isReactivating, setIsReactivating] = useState(false)
  const [accountStatus, setAccountStatus] = useState<string>("active")

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        
        // Get account status
        const status = (user.user_metadata?.account_status as string) || "active"
        setAccountStatus(status)
        
        const { data, error } = await supabase
          .from("profiles")
          .select("email_notifications, sms_notifications, push_notifications, status")
          .eq("id", user.id)
          .single()

        if (data) {
          // Use profile status if available, otherwise use metadata status
          if (data.status) {
            setAccountStatus(data.status)
          }
          
          setNotifications({
            emailMessages: data.email_notifications ?? true,
            emailOffers: false,
            smsMessages: data.sms_notifications ?? false,
            pushNotifications: data.push_notifications ?? true,
            weeklyDigest: true,
          })
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [user])

  const saveSettings = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email_notifications: notifications.emailMessages,
          sms_notifications: notifications.smsMessages,
          push_notifications: notifications.pushNotifications,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )

      if (error) {
        throw error
      }

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully!",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications({ ...notifications, [key]: value })
    setTimeout(saveSettings, 500) // Auto-save after 500ms
  }

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your account preferences and privacy settings</p>
              </div>
              {isSaving && (
                <Badge variant="outline" className="flex items-center">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <DashboardNav />
            </div>
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Notification Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email for Messages</h4>
                        <p className="text-sm text-muted-foreground">Get notified when someone messages you</p>
                      </div>
                      <Switch
                        checked={notifications.emailMessages}
                        onCheckedChange={(checked) => handleNotificationChange("emailMessages", checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email for Offers</h4>
                        <p className="text-sm text-muted-foreground">Receive notifications about price offers</p>
                      </div>
                      <Switch
                        checked={notifications.emailOffers}
                        onCheckedChange={(checked) => handleNotificationChange("emailOffers", checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">SMS Notifications</h4>
                        <p className="text-sm text-muted-foreground">Get text messages for urgent updates</p>
                      </div>
                      <Switch
                        checked={notifications.smsMessages}
                        onCheckedChange={(checked) => handleNotificationChange("smsMessages", checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Push Notifications</h4>
                        <p className="text-sm text-muted-foreground">Browser notifications for real-time updates</p>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) => handleNotificationChange("pushNotifications", checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Weekly Digest</h4>
                        <p className="text-sm text-muted-foreground">Summary of your ad performance</p>
                      </div>
                      <Switch
                        checked={notifications.weeklyDigest}
                        onCheckedChange={(checked) => handleNotificationChange("weeklyDigest", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Account Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-muted/40 p-4">
                      <h4 className="font-medium">Change Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Need a reset link? Head to the reset page to securely update your password.
                      </p>
                      <Button className="mt-3" variant="outline" onClick={() => router.push("/auth/update-password")}>Go to Password Reset</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Status Section */}
                {accountStatus === "deactivated" ? (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-yellow-800">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Account Deactivated
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg border border-yellow-300 bg-yellow-100 p-4">
                        <h4 className="font-medium text-yellow-900">Reactivate Your Account</h4>
                        <p className="text-sm text-yellow-800 mt-2">
                          Your account is currently deactivated. You can reactivate it to regain full access to all features.
                        </p>
                        <Button
                          className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                          disabled={isReactivating}
                          onClick={async () => {
                            if (!user?.id || isReactivating) return
                            const confirmed = confirm(
                              "Are you sure you want to reactivate your account? You will regain full access to all features."
                            )
                            if (!confirmed) return

                            setIsReactivating(true)

                            try {
                              const response = await fetch("/api/account/status", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "active" }),
                              })

                              if (!response.ok) {
                                const payload = await response.json().catch(() => ({}))
                                throw new Error(payload.error || "Request failed")
                              }

                              toast({
                                title: "Account Reactivated",
                                description: "Your account has been reactivated successfully! You now have full access to all features.",
                              })

                              // Refresh the page to update the UI
                              setAccountStatus("active")
                              window.location.reload()
                            } catch (error) {
                              console.error("Reactivate error", error)
                              toast({
                                variant: "destructive",
                                title: "Reactivation Failed",
                                description: "We couldn't reactivate your account. Please try again or contact support.",
                              })
                            } finally {
                              setIsReactivating(false)
                            }
                          }}
                        >
                          {isReactivating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Reactivating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Reactivate Account
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-yellow-700">
                        Note: If you're unable to reactivate, please contact marketplace support or a super admin for assistance.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-destructive/20">
                    <CardHeader>
                      <CardTitle className="flex items-center text-destructive">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Danger Zone
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                        <h4 className="font-medium text-destructive">Deactivate Account</h4>
                        <p className="text-sm text-destructive/80">
                          Deactivating immediately suspends access to listings and messages. We retain your data for 30 days so
                          you can reactivate if needed.
                        </p>
                        <Button
                          className="mt-4"
                          variant="destructive"
                          disabled={isDeactivating}
                          onClick={async () => {
                            if (!user?.id || isDeactivating) return
                            const confirmed = confirm(
                              "Are you sure you want to deactivate your account? You can reactivate it anytime from the settings page."
                            )
                            if (!confirmed) return

                            setIsDeactivating(true)

                            try {
                              const response = await fetch("/api/account/status", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "deactivated" }),
                              })

                              if (!response.ok) {
                                const payload = await response.json().catch(() => ({}))
                                throw new Error(payload.error || "Request failed")
                              }

                              toast({
                                title: "Account Deactivated",
                                description:
                                  "Your account has been deactivated. You can reactivate it anytime from this page.",
                              })

                              // Update status and refresh
                              setAccountStatus("deactivated")
                              window.location.reload()
                            } catch (error) {
                              console.error("Deactivate error", error)
                              toast({
                                variant: "destructive",
                                title: "Deactivation Failed",
                                description: "We couldn't deactivate your account. Please try again or contact support.",
                              })
                            } finally {
                              setIsDeactivating(false)
                            }
                          }}
                        >
                          {isDeactivating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deactivating...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate Account
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You can reactivate your account anytime within 30 days. After 30 days, data may be purged from active systems.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
