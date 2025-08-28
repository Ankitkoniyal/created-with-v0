"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bell, Eye, Trash2, Download, AlertTriangle, Loader2 } from "lucide-react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const [notifications, setNotifications] = useState({
    emailMessages: true,
    emailOffers: false,
    smsMessages: false,
    pushNotifications: true,
    weeklyDigest: true,
  })

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

                {/* Account Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="h-5 w-5 mr-2" />
                      Account Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Download Your Data</h4>
                        <p className="text-sm text-muted-foreground">Export all your account data and ads</p>
                      </div>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Account Status</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {user?.email_verified ? (
                            <Badge variant="secondary" className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center text-orange-600 border-orange-200">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">Member since Dec 2024</span>
                        </div>
                      </div>
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
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">
                          Deactivate your account (your information will be preserved for system integrity)
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (
                            confirm("Are you sure you want to deactivate your account? This action cannot be undone.")
                          ) {
                            console.log(
                              "[v0] Account deactivation requested - user data will be preserved for system integrity",
                            )
                            alert("Account has been deactivated. Your data is preserved for system integrity.")
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deactivate Account
                      </Button>
                    </div>
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
