"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, Package, Heart, User, Settings, MessageSquare } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [dashboardCounts, setDashboardCounts] = useState({
    myAds: 0,
    favorites: 0,
    messages: 0,
  })
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageKey, setImageKey] = useState(0)

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name, created_at")
        .eq("id", user.id)
        .single()
      
      setUserProfile(profile)

      const [adsResult, favoritesResult, messagesResult] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("receiver_id", user.id).eq("is_read", false),
      ])

      setDashboardCounts({
        myAds: adsResult.count || 0,
        favorites: favoritesResult.count || 0,
        messages: messagesResult.count || 0,
      })
    } catch (error) {
      console.log("Error fetching dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.id) return

    fetchDashboardData()

    const supabase = createClient()
    
    const profileSubscription = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          setUserProfile(payload.new)
          setImageKey(prev => prev + 1)
        }
      )
      .subscribe()

    const handleProfileUpdate = () => {
      fetchDashboardData()
      setImageKey(prev => prev + 1)
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)
    
    return () => {
      profileSubscription.unsubscribe()
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [user?.id])

  const getDisplayName = () => {
    if (userProfile?.full_name) return userProfile.full_name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name
    if (user?.email) return user.email.split('@')[0]
    return "User"
  }

  const getAvatarUrl = () => {
    if (userProfile?.avatar_url) {
      return userProfile.avatar_url
    }
    return user?.user_metadata?.avatar_url || ""
  }

  const getAvatarInitials = () => {
    return getDisplayName().charAt(0).toUpperCase()
  }

  const getMemberSinceText = () => {
    if (userProfile?.created_at) {
      const joinDate = new Date(userProfile.created_at)
      return `Member since ${joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    }
    if (user?.created_at) {
      const joinDate = new Date(user.created_at)
      return `Member since ${joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    }
    return ""
  }

  const navItems = [
    { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { title: "My Ads", href: "/dashboard/listings", icon: Package },
    { title: "Favorites", href: "/dashboard/favorites", icon: Heart, badge: dashboardCounts.favorites > 0 ? dashboardCounts.favorites.toString() : undefined },
    { title: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: dashboardCounts.messages > 0 ? dashboardCounts.messages.toString() : undefined },
    { title: "Profile", href: "/dashboard/profile", icon: User },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-12 w-12 bg-gray-700 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Avatar key={imageKey} className="h-12 w-12 border-2 border-green-600">
            <AvatarImage 
              src={getAvatarUrl()} 
              alt={getDisplayName()}
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <AvatarFallback className="bg-green-900 text-green-300 font-semibold">
              {getAvatarInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-white">{getDisplayName()}</h3>
            {getMemberSinceText() && (
              <p className="text-sm text-gray-400 mt-1">{getMemberSinceText()}</p>
            )}
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  isActive 
                    ? 'bg-green-700 text-white hover:bg-green-600' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => router.push(item.href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
                {item.badge && (
                  <Badge className="ml-auto bg-red-500 text-white text-xs min-w-[20px] h-5">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            )
          })}
        </nav>
      </CardContent>
    </Card>
  )
}
