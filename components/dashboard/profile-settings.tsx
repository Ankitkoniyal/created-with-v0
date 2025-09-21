"use client"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Camera, Shield, Star, Calendar, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface UIState {
  isEditing: boolean
  isSaving: boolean
  showPasswordReset: boolean
  isResendingVerification: boolean
  isLoading: boolean
}

export function ProfileSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uiState, setUiState] = useState<UIState>({
    isEditing: false,
    isSaving: false,
    showPasswordReset: false,
    isResendingVerification: false,
    isLoading: true
  })

  const [imageUpload, setImageUpload] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    bio: "",
    mobile: "",
  })

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setUiState(prev => ({ ...prev, isLoading: false }))
        return
      }

      setUiState(prev => ({ ...prev, isLoading: true }))

      try {
        const supabase = createClient()

        // Try to fetch profile data with a simpler query first
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Profile fetch error:", profileError)
          
          // If there's an RLS policy error, provide specific guidance
          if (profileError.message?.includes('row-level security') || profileError.code === '42501') {
            toast({
              variant: "destructive",
              title: "Permissions Issue",
              description: (
                <div>
                  <p>Your Supabase RLS policies need configuration.</p>
                  <p className="text-sm mt-1">
                    Please check your database policies for the 'profiles' table.
                  </p>
                </div>
              ),
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://supabase.com/docs/guides/auth/row-level-security', '_blank')}
                  className="mt-2"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  View RLS Documentation
                </Button>
              )
            })
          } else {
            toast({
              variant: "destructive",
              title: "Error loading profile",
              description: "Failed to load your profile data. Please try again.",
            })
          }
        }

        setProfileData(profileData)

        setFormData({
          name: profileData?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          location: profileData?.location || user.user_metadata?.location || "",
          bio: profileData?.bio || user.user_metadata?.bio || "",
          mobile: profileData?.phone || user.user_metadata?.phone || "",
        })
      } catch (error) {
        console.error("Error fetching profile data:", error)
        toast({
          variant: "destructive",
          title: "Unexpected error",
          description: "An unexpected error occurred while loading your profile.",
        })
      } finally {
        setUiState(prev => ({ ...prev, isLoading: false }))
      }
    }

    fetchProfileData()
  }, [user, toast])

  const handleSave = async () => {
    if (!user) return

    // Basic client-side validation
    if (formData.name.trim().length < 2) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name must be at least 2 characters long.",
      })
      return
    }

    if (formData.bio.length > 500) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Bio cannot exceed 500 characters.",
      })
      return
    }

    setUiState(prev => ({ ...prev, isSaving: true }))

    try {
      const supabase = createClient()
      let avatarUrl = profileData?.avatar_url || user.user_metadata?.avatar_url

      // Handle image upload if a new file is selected
      if (imageUpload) {
        const fileExt = imageUpload.name.split(".").pop()
        const fileName = `${user.id}/avatar.${fileExt}`

        try {
          // First try to delete any existing avatars
          const existingFiles = [`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]
          await supabase.storage
            .from("avatars")
            .remove(existingFiles)
            .catch(error => {
              console.log("No existing avatars to delete or delete failed:", error)
            })

          // Upload the new image
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, imageUpload, { 
              upsert: true,
              cacheControl: '3600'
            })

          if (uploadError) {
            console.error("Upload error details:", uploadError)
            
            if (uploadError.message?.includes('row-level security policy') || uploadError.message?.includes('policy')) {
              throw new Error(
                "Storage permissions issue. Please check your Supabase storage policies. " +
                "You need to configure RLS policies for the 'avatars' bucket."
              )
            }
            throw new Error(uploadError.message || "Failed to upload image")
          }

          // Get the public URL with cache busting
          const { data: { publicUrl } } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName)

          avatarUrl = `${publicUrl}?t=${Date.now()}`

          toast({
            title: "Image Uploaded",
            description: "Profile picture updated successfully!",
          })
        } catch (uploadError: any) {
          console.error("Image upload failed:", uploadError)
          
          if (uploadError.message.includes('row-level security policy') || uploadError.message.includes('policy')) {
            toast({
              variant: "destructive",
              title: "Storage Configuration Issue",
              description: (
                <div>
                  <p>Your Supabase storage policies need to be configured.</p>
                  <p className="text-sm mt-1">
                    Please check the storage policies for the 'avatars' bucket.
                  </p>
                </div>
              ),
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://supabase.com/docs/guides/storage/security/row-level-security', '_blank')}
                  className="mt-2"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
              )
            })
          } else {
            toast({
              variant: "destructive",
              title: "Upload Failed",
              description: uploadError.message || "Failed to upload image. Please try again.",
            })
          }
        }
      }

      // Update user metadata in Supabase Auth
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          location: formData.location,
          bio: formData.bio,
          avatar_url: avatarUrl,
          phone: formData.mobile,
        },
      })

      if (authUpdateError) {
        throw authUpdateError
      }

      // Prepare data for upserting into the `profiles` table
      const profileUpdateData = {
        id: user.id,
        email: user.email!,
        full_name: formData.name,
        location: formData.location,
        bio: formData.bio,
        avatar_url: avatarUrl,
        phone: formData.mobile,
        updated_at: new Date().toISOString(),
      }

      const { data: updatedProfile, error: profileUpdateError } = await supabase
        .from("profiles")
        .upsert(profileUpdateData, { onConflict: "id" })
        .select()
        .single()

      if (profileUpdateError) {
        console.error("Profile update error:", profileUpdateError)
        
        // Check if this is an RLS policy error
        if (profileUpdateError.message?.includes('row-level security') || profileUpdateError.code === '42501') {
          toast({
            variant: "destructive",
            title: "Database Permissions Issue",
            description: (
              <div>
                <p>Your Supabase RLS policies need configuration.</p>
                <p className="text-sm mt-1">
                  Please check your database policies for the 'profiles' table.
                </p>
              </div>
            ),
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://supabase.com/docs/guides/auth/row-level-security', '_blank')}
                className="mt-2"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                View RLS Documentation
              </Button>
            )
          })
        } else {
          throw new Error(profileUpdateError.message || 'Failed to update profile')
        }
      }

      // Update state with the new data
      setProfileData(updatedProfile)
      
      // Clear the image upload state
      setImageUpload(null)
      setPreviewUrl(null)

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      })

      setUiState(prev => ({ ...prev, isEditing: false }))

    } catch (error: any) {
      console.error("Profile save error:", error)
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
      })
    } finally {
      setUiState(prev => ({ ...prev, isSaving: false }))
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setUiState(prev => ({ ...prev, showPasswordReset: false }))

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Reset Email Sent",
        description: "Password reset email sent! Check your inbox.",
      })
    } catch (error: any) {
      console.error("Password reset error:", error)
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to send password reset email. Please try again.",
      })
    }
  }

  const handleResendVerification = async () => {
    if (!user?.email) return
    setUiState(prev => ({ ...prev, isResendingVerification: true }))

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and click the verification link.",
      })
    } catch (error: any) {
      console.error("Verification error:", error)
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Failed to send verification email. Please try again.",
      })
    } finally {
      setUiState(prev => ({ ...prev, isResendingVerification: false }))
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Image must be less than 2MB. Please choose a smaller image.",
        })
        return
      }

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a JPEG, PNG, or WebP image.",
        })
        return
      }

      setImageUpload(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      if (!uiState.isEditing) {
        setUiState(prev => ({ ...prev, isEditing: true }))
      }

      toast({
        title: "Image Selected",
        description: "Click 'Save Changes' to upload your new profile picture.",
      })
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // Get the avatar URL with proper priority
  const avatarUrl = previewUrl || profileData?.avatar_url || user?.user_metadata?.avatar_url

  if (uiState.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your personal information and preferences</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={avatarUrl || "/placeholder.svg"}
                  alt={formData.name}
                  key={avatarUrl ? `${avatarUrl}-${Date.now()}` : undefined}
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
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 p-0 shadow-lg hover:shadow-xl transition-shadow"
                type="button"
                onClick={handleAvatarClick}
              >
                <Camera className="h-5 w-5" />
              </Button>
              <input
                ref={fileInputRef}
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold text-foreground">{formData.name || user?.email}</h2>
                <Badge
                  variant={user?.email_confirmed_at ? "secondary" : "outline"}
                  className={`flex items-center ${user?.email_confirmed_at ? 'bg-green-700 text-white' : 'bg-orange-100 text-orange-800 border-orange-300'}`}
                >
                  {user?.email_confirmed_at ? (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    "Unverified"
                  )}
                </Badge>
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
            variant={uiState.isEditing ? "default" : "outline"}
            onClick={() => uiState.isEditing ? handleSave() : setUiState(prev => ({ ...prev, isEditing: true }))}
            disabled={uiState.isSaving}
            className={uiState.isEditing ? "bg-green-700 hover:bg-green-800" : ""}
          >
            {uiState.isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : uiState.isEditing ? (
              "Save Changes"
            ) : (
              "Edit Profile"
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!uiState.isEditing}
                minLength={2}
              />
              <p className="text-xs text-muted-foreground">Minimum 2 characters required</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled={true} className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                disabled={!uiState.isEditing}
                placeholder="Enter your phone number"
              />
              <p className="text-xs text-muted-foreground">
                {uiState.isEditing ? "Update your phone number for better communication" : "Phone number for contact purposes"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={!uiState.isEditing}
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
              disabled={!uiState.isEditing}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user?.email_confirmed_at && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Verification</h4>
                  <p className="text-sm text-muted-foreground">Verify your email address to secure your account</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={uiState.isResendingVerification}
                >
                  {uiState.isResendingVerification ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
              </div>

              <Separator />
            </>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Password</h4>
              <p className="text-sm text-muted-foreground">Reset your account password</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setUiState(prev => ({ ...prev, showPasswordReset: true }))}
            >
              Reset Password
            </Button>
          </div>

          {uiState.showPasswordReset && (
            <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-3">
                A password reset link will be sent to your email address.
              </p>
              <div className="flex space-x-2">
                <Button size="sm" onClick={handlePasswordReset}>
                  Send Reset Link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUiState(prev => ({ ...prev, showPasswordReset: false }))}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
