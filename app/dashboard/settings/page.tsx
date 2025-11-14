"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bell, Trash2, AlertTriangle, Loader2 } from "lucide-react"
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

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("profiles")
          .select("email_notifications, sms_notifications, push_notifications")
          .eq("id", user.id)
          .single()

        if (data) {
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

                {/* Danger Zone */}
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
                            "Are you sure you want to deactivate your account? You can reactivate within 30 days by contacting support or a super admin."
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
                                "You have been signed out. Your data stays archived for 30 days—contact support or a super admin to reactivate.",
                            })

                            await logout()
                            router.replace("/auth/login?message=account_deactivated")
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
                      Reactivation: reach out to marketplace support or a super admin within 30 days. They can restore your
                      access instantly; after 30 days data is purged from active systems.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
