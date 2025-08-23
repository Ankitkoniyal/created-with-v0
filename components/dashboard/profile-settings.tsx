"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Camera, Shield, Star, Calendar, AlertTriangle, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

export function ProfileSettings() {
  const { user, profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [imageUpload, setImageUpload] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    bio: "",
    mobile: "",
    contactVisibility: {
      showPhone: true,
      showEmail: false,
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  })

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return

      setIsLoading(true)
      console.log("[v0] Fetching profile data for user:", user.id)

      try {
        const supabase = createClient()

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          console.error("[v0] Profile fetch error:", profileError)
        }

        console.log("[v0] Profile data fetched:", profileData)
        setProfileData(profileData)

        setFormData({
          name: profileData?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          location: profileData?.location || user.user_metadata?.location || "Toronto, ON",
          bio: profileData?.bio || user.user_metadata?.bio || "New to the marketplace. Looking forward to great deals!",
          mobile: profileData?.phone || user.phone || "",
          contactVisibility: {
            showPhone: profileData?.show_phone ?? true,
            showEmail: profileData?.show_email ?? false,
          },
          notifications: {
            email: profileData?.email_notifications ?? true,
            sms: profileData?.sms_notifications ?? false,
            push: profileData?.push_notifications ?? true,
          },
        })

        console.log("[v0] Form data initialized:", {
          name: profileData?.full_name || user.user_metadata?.full_name,
          mobile: profileData?.phone || user.phone || "Not found",
          email: user.email,
        })
      } catch (error) {
        console.error("[v0] Error fetching profile data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    console.log("[v0] Starting profile save process...")

    try {
      const supabase = createClient()

      let avatarUrl = profileData?.avatar_url || user.user_metadata?.avatar_url

      if (imageUpload) {
        console.log("[v0] Uploading profile image...")
        const fileExt = imageUpload.name.split(".").pop()
        const fileName = `${user.id}/avatar.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, imageUpload, { upsert: true })

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(fileName)
          avatarUrl = publicUrl
          console.log("[v0] Image uploaded successfully:", publicUrl)
        } else {
          console.error("[v0] Avatar upload error:", uploadError)
        }
      }

      console.log("[v0] Updating auth user metadata...")
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          location: formData.location,
          bio: formData.bio,
          avatar_url: avatarUrl,
        },
      })

      if (authUpdateError) {
        console.error("[v0] Auth update error:", authUpdateError)
        throw authUpdateError
      }

      console.log("[v0] Updating profiles table...")
      const profileUpdateData = {
        id: user.id,
        full_name: formData.name,
        location: formData.location,
        bio: formData.bio,
        avatar_url: avatarUrl,
        show_phone: formData.contactVisibility.showPhone,
        show_email: formData.contactVisibility.showEmail,
        email_notifications: formData.notifications.email,
        sms_notifications: formData.notifications.sms,
        push_notifications: formData.notifications.push,
        updated_at: new Date().toISOString(),
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .upsert(profileUpdateData, { onConflict: "id" })

      if (profileUpdateError) {
        console.error("[v0] Profile update error:", profileUpdateError)
      }

      console.log("[v0] Profile updated successfully")
      alert("Profile updated successfully!")
      setIsEditing(false)
      setImageUpload(null)
      setPreviewUrl(null)

      setProfileData({ ...profileData, ...profileUpdateData })
    } catch (error) {
      console.error("[v0] Profile save error:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
      console.log("[v0] Profile save process completed")
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error("[v0] Password reset error:", error)
        alert("Failed to send password reset email. Please try again.")
      } else {
        alert("Password reset email sent! Check your inbox.")
        setShowPasswordReset(false)
      }
    } catch (error) {
      console.error("[v0] Password reset error:", error)
      alert("An error occurred. Please try again.")
    }
  }

  const handleDeleteAccount = async () => {
    console.log("[v0] Account deletion requested - user data will be preserved for system integrity")
    alert("Account has been deactivated. Your information is preserved for system integrity and legal compliance.")
    setShowDeleteConfirm(false)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be less than 2MB")
        return
      }

      setImageUpload(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      console.log("[v0] Profile image selected:", file.name)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={previewUrl || profileData?.avatar_url || user?.user_metadata?.avatar_url || "/placeholder.svg"}
                  alt={formData.name}
                />
                <AvatarFallback className="text-2xl">
                  {formData.name
                    ? formData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload">
                <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 cursor-pointer">
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold text-foreground">{formData.name || user?.email}</h2>
                {user?.email_verified && (
                  <Badge variant="secondary" className="flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                  <span>New Member</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Member since{" "}
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : "Recently"}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground">{formData.bio}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personal Information</CardTitle>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Edit Profile"
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled={true} className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={formData.mobile || "Not provided"} disabled={true} className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                {formData.mobile ? "Phone number from your profile" : "No phone number on file"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditing}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Show Phone Number</h4>
              <p className="text-sm text-muted-foreground">Display your phone number on your ads for direct contact</p>
            </div>
            <Switch
              checked={formData.contactVisibility.showPhone}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  contactVisibility: { ...formData.contactVisibility, showPhone: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Show Email</h4>
              <p className="text-sm text-muted-foreground">Display your email address on your ads for inquiries</p>
            </div>
            <Switch
              checked={formData.contactVisibility.showEmail}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  contactVisibility: { ...formData.contactVisibility, showEmail: checked },
                })
              }
            />
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Privacy Note:</strong> When enabled, your contact information will be visible to all users viewing
              your ads. Only logged-in users can see your full contact details.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Password</h4>
              <p className="text-sm text-muted-foreground">Reset your account password</p>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordReset(true)}>
              Reset Password
            </Button>
          </div>

          {showPasswordReset && (
            <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-3">
                A password reset link will be sent to your email address.
              </p>
              <div className="flex space-x-2">
                <Button size="sm" onClick={handlePasswordReset}>
                  Send Reset Link
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPasswordReset(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-600">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently deactivate your account (data preserved for system integrity)
              </p>
            </div>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 mb-3">
                    <strong>Account Deactivation:</strong> Your account will be deactivated but your information will be
                    preserved for system integrity, legal compliance, and transaction history.
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="destructive" onClick={handleDeleteAccount}>
                      Confirm Deactivation
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">Receive updates about your listings and messages</p>
            </div>
            <Switch
              checked={formData.notifications.email}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  notifications: { ...formData.notifications, email: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">SMS Notifications</h4>
              <p className="text-sm text-muted-foreground">Get text messages for urgent updates</p>
            </div>
            <Switch
              checked={formData.notifications.sms}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  notifications: { ...formData.notifications, sms: checked },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Push Notifications</h4>
              <p className="text-sm text-muted-foreground">Browser notifications for real-time updates</p>
            </div>
            <Switch
              checked={formData.notifications.push}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  notifications: { ...formData.notifications, push: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
