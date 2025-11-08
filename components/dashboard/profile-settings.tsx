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
import { Camera, Shield, Calendar, Loader2, Upload, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface UIState {
  isEditing: boolean
  isSaving: boolean
  showPasswordReset: boolean
  isResendingVerification: boolean
  isLoading: boolean
  isUploadingImage: boolean
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
    isLoading: true,
    isUploadingImage: false
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

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

        if (profileError) {
          console.error("Profile fetch error:", profileError)
          // Don't throw error if profile doesn't exist yet
          if (profileError.code === 'PGRST116') {
            console.log("No profile found, will create on save")
          } else {
            throw profileError
          }
        }

        setProfileData(profileData || {})

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
          title: "Error",
          description: "Failed to load profile data",
        })
      } finally {
        setUiState(prev => ({ ...prev, isLoading: false }))
      }
    }

    fetchProfileData()
  }, [user, toast])

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error("No user found")

    const supabase = createClient()
    
    // Generate unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = fileName

    console.log("Uploading avatar to path:", filePath)

    // Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error("Upload error details:", uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    console.log("Upload successful, public URL:", publicUrl)
    return publicUrl
  }

  const handleSave = async () => {
  if (!user) return

  if (formData.name.trim().length < 2) {
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: "Name must be at least 2 characters long.",
    })
    return
  }

  setUiState(prev => ({ ...prev, isSaving: true }))

  try {
    const supabase = createClient()
    let avatarUrl = profileData?.avatar_url

    // Upload new image if selected
    if (imageUpload) {
      setUiState(prev => ({ ...prev, isUploadingImage: true }))
      try {
        avatarUrl = await uploadAvatar(imageUpload)
      } catch (uploadError: any) {
        console.error("Image upload failed:", uploadError)
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: uploadError.message || "Failed to upload image.",
        })
        setUiState(prev => ({ ...prev, isSaving: false, isUploadingImage: false }))
        return
      } finally {
        setUiState(prev => ({ ...prev, isUploadingImage: false }))
      }
    }

    // Update profile data - MAKE SURE TO INCLUDE EMAIL
    // Update profile data  
        const profileUpdateData = {
        id: user.id,
        email: user.email!, // ← ADD THIS LINE
        full_name: formData.name.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
        phone: formData.mobile.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }

    console.log("Updating profile with data:", profileUpdateData)

    const { data: updatedRows, error: profileUpdateError } = await supabase
      .from("profiles")
      .upsert(profileUpdateData, { onConflict: "id" })
      .select()
      .maybeSingle()

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError)
      throw profileUpdateError
    }

    // Persist changes locally so the UI reflects immediately
    const latestProfile = updatedRows || profileUpdateData
    window.dispatchEvent(new Event("profileUpdated"))

    setProfileData((prev: any) => ({
      ...(prev || {}),
      ...latestProfile,
    }))

    setFormData({
      name: profileUpdateData.full_name,
      location: profileUpdateData.location,
      bio: profileUpdateData.bio,
      mobile: profileUpdateData.phone,
    })

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setImageUpload(null)
    setPreviewUrl(null)

    setUiState(prev => ({ ...prev, isEditing: false }))

    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    })
  } catch (error: any) {
    console.error("Profile save error:", error)
    toast({
      variant: "destructive",
      title: "Update Failed",
      description: error.message || "Failed to update profile.",
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

      if (error) throw error

      toast({
        title: "Reset Email Sent",
        description: "Password reset email sent! Check your inbox.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to send reset email.",
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

      if (error) throw error

      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Failed to send verification email.",
      })
    } finally {
      setUiState(prev => ({ ...prev, isResendingVerification: false }))
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Image must be less than 2MB.",
      })
      return
    }

    // Validate file type
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

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = () => {
    setImageUpload(null)
    setPreviewUrl(null)
  }

  const getAvatarUrl = () => {
    if (previewUrl) return previewUrl
    if (profileData?.avatar_url) {
      try {
        const url = new URL(profileData.avatar_url)
        if (profileData?.updated_at) {
          url.searchParams.set('t', new Date(profileData.updated_at).getTime().toString())
        }
        return url.toString()
      } catch {
        return profileData.avatar_url
      }
    }
    return ""
  }

  const getInitials = () => {
    const name = formData.name || user?.email || "User"
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const avatarUrl = getAvatarUrl()

  if (uiState.isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground mt-2">Manage your personal information and preferences</p>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-green-600">
                <AvatarImage
                  src={avatarUrl}
                  alt={formData.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl bg-green-100 text-green-800 font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex gap-2 absolute -bottom-2 -right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-10 w-10 rounded-full p-0 shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  disabled={uiState.isUploadingImage}
                >
                  {uiState.isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                
                {previewUrl && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-10 w-10 rounded-full p-0 shadow-lg"
                    onClick={removeImage}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold">{formData.name || user?.email}</h2>
                <Badge
                  variant={user?.email_confirmed_at ? "default" : "outline"}
                  className={user?.email_confirmed_at ? 'bg-green-600' : 'bg-orange-100 text-orange-800 border-orange-300'}
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

              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  Member since{" "}
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                    : "Recently"}
                </span>
              </div>

              {formData.bio && (
                <p className="text-muted-foreground text-sm">{formData.bio}</p>
              )}

              {imageUpload && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Upload className="h-4 w-4" />
                  <span>New image selected - click Save to upload</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Personal Information</CardTitle>
          <div className="flex gap-2">
            {uiState.isEditing && (
              <Button
                variant="outline"
                onClick={() => {
                  setUiState(prev => ({ ...prev, isEditing: false }))
                  setImageUpload(null)
                  setPreviewUrl(null)
                  // Reset form data
                  setFormData({
                    name: profileData?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "",
                    location: profileData?.location || user?.user_metadata?.location || "",
                    bio: profileData?.bio || user?.user_metadata?.bio || "",
                    mobile: profileData?.phone || user?.user_metadata?.phone || "",
                  })
                }}
                disabled={uiState.isSaving}
              >
                Cancel
              </Button>
            )}
            <Button
              variant={uiState.isEditing ? "default" : "outline"}
              onClick={() => uiState.isEditing ? handleSave() : setUiState(prev => ({ ...prev, isEditing: true }))}
              disabled={uiState.isSaving}
              className={uiState.isEditing ? "bg-green-600 hover:bg-green-700" : ""}
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!uiState.isEditing || uiState.isSaving}
                minLength={2}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={user?.email || ""} 
                disabled 
                className="bg-muted cursor-not-allowed" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                disabled={!uiState.isEditing || uiState.isSaving}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={!uiState.isEditing || uiState.isSaving}
                placeholder="City, State"
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
              disabled={!uiState.isEditing || uiState.isSaving}
              maxLength={500}
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user?.email_confirmed_at && (
            <>
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex-1">
                  <h4 className="font-medium flex items-center gap-2">
                    Email Verification Required
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please verify your email to secure your account
                  </p>
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
              <p className="text-sm text-muted-foreground">Change your account password</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setUiState(prev => ({ ...prev, showPasswordReset: true }))}
            >
              Reset Password
            </Button>
          </div>

          {uiState.showPasswordReset && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
              <p className="text-sm text-muted-foreground">
                A password reset link will be sent to <strong>{user?.email}</strong>
              </p>
              <div className="flex gap-2">
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