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
import { Camera, Shield, Calendar, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface UIState {
  isEditing: boolean
  isSaving: boolean
  isLoading: boolean
}

export function ProfileSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uiState, setUiState] = useState<UIState>({
    isEditing: false,
    isSaving: false,
    isLoading: true
  })

  const [imageUpload, setImageUpload] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [avatarVersion, setAvatarVersion] = useState<number>(0)
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
          .single()

        if (profileError) {
          console.error("Profile fetch error:", profileError)
        }

        setProfileData(profileData)

        setFormData({
          name: profileData?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          location: profileData?.location || user.user_metadata?.location || "",
          bio: profileData?.bio || user.user_metadata?.bio || "",
          mobile: profileData?.phone || user.user_metadata?.phone || "",
        })
        if (profileData?.avatar_url) {
          setAvatarVersion(Date.now())
        }
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
      let avatarUrl = profileData?.avatar_url

      // Handle image upload if a new file is selected
      if (imageUpload) {
        try {
          // Create unique file name
          const fileExt = imageUpload.name.split('.').pop()
          const fileName = `${user.id}-${Date.now()}.${fileExt}`
          const filePath = `${user.id}/${fileName}`

          console.log('Uploading image:', filePath)

          // Upload the image
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('avatars')
            .upload(filePath, imageUpload, {
              upsert: true,
              cacheControl: '3600'
            })

          if (uploadError) {
            console.error('Upload error:', uploadError)
            throw new Error(`Upload failed: ${uploadError.message}`)
          }

          console.log('Upload successful:', uploadData)

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(filePath)

          avatarUrl = publicUrl
          console.log('Generated public URL:', avatarUrl)

          toast({
            title: "Image Uploaded",
            description: "Profile picture updated successfully!",
          })

        } catch (uploadError: any) {
          console.error("Image upload failed:", uploadError)
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: uploadError.message || "Failed to upload image. Please try again.",
          })
          setUiState(prev => ({ ...prev, isSaving: false }))
          return
        }
      }

      // Update profile data
      const profileUpdateData = {
        id: user.id,
        email: user.email!,
        full_name: formData.name,
        location: formData.location,
        bio: formData.bio,
        phone: formData.mobile,
        updated_at: new Date().toISOString(),
        ...(avatarUrl && { avatar_url: avatarUrl }) // Only include avatar_url if it exists
      }

      console.log('Updating profile with:', profileUpdateData)

      const { data: updatedProfile, error: profileUpdateError } = await supabase
        .from("profiles")
        .upsert(profileUpdateData, { onConflict: "id" })
        .select()
        .single()

      if (profileUpdateError) {
        console.error("Profile update error:", profileUpdateError)
        throw new Error(profileUpdateError.message || 'Failed to update profile')
      }

      // Also update user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          avatar_url: avatarUrl,
        },
      })

      // Update state with the new data
      setProfileData(updatedProfile)
      setFormData((prev) => ({
        ...prev,
        name: updatedProfile?.full_name || prev.name,
        location: updatedProfile?.location || prev.location,
        bio: updatedProfile?.bio || prev.bio,
        mobile: updatedProfile?.phone || prev.mobile,
      }))

      // Clear the image upload state but preserve preview until refetch completes
      setImageUpload(null)
      if (avatarUrl) {
        setPreviewUrl(avatarUrl)
        setAvatarVersion(Date.now())
      }

      // Notify other components
      window.dispatchEvent(new CustomEvent("profileUpdated"))

      // Background refresh to ensure consistency
      setTimeout(async () => {
        const { data: freshData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        if (freshData) {
          setProfileData(freshData)
          if (freshData.avatar_url) {
            setPreviewUrl(freshData.avatar_url)
            setAvatarVersion(Date.now())
          }
        }
      }, 500)

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

  // Get the avatar URL with cache busting
  const getAvatarUrl = () => {
    const url = previewUrl || profileData?.avatar_url
    if (url && !url.includes('blob:')) {
      const separator = url.includes('?') ? '&' : '?'
      return avatarVersion ? `${url}${separator}v=${avatarVersion}` : url
    }
    return url
  }

  const avatarUrl = getAvatarUrl()

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
              <Avatar
                className="h-24 w-24 border-2 border-green-700 cursor-pointer"
                onClick={handleAvatarClick}
              >
                <AvatarImage
                  src={avatarUrl || "/placeholder.svg"}
                  alt={formData.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl bg-green-100 text-green-800 font-semibold">
                  {formData.name
                    ? formData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md bg-green-700 hover:bg-green-800 text-white"
                onClick={handleAvatarClick}
              >
                <Camera className="h-4 w-4" />
              </Button>
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
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Member since{" "}
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : "Recently"}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground">{formData.bio || "No bio yet."}</p>
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
    </div>
  )
}
