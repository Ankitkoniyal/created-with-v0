"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, Package, Heart, User, Settings, MessageSquare, TrendingUp } from "lucide-react"
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

  useEffect(() => {
    if (!user?.id) return

    const fetchDashboardCounts = async () => {
      try {
        const supabase = createClient()
        if (!supabase) {
          console.error("Supabase client not available")
          return
        }

        // Fix the products query to ensure we're getting the right data
        const [adsResult, favoritesResult, messagesResult] = await Promise.all([
          supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "active"), // Added status filter
          supabase
            .from("favorites")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("receiver_id", user.id)
            .eq("is_read", false),
        ])

        // Check for errors in each query
        if (adsResult.error) {
          console.error("Error fetching ads count:", adsResult.error)
        }
        if (favoritesResult.error) {
          console.error("Error fetching favorites count:", favoritesResult.error)
        }
        if (messagesResult.error) {
          console.error("Error fetching messages count:", messagesResult.error)
        }

        setDashboardCounts({
          myAds: adsResult.count || 0,
          favorites: favoritesResult.count || 0,
          messages: messagesResult.count || 0,
        })
      } catch (error) {
        console.error("Error fetching dashboard counts:", error)
      }
    }

    fetchDashboardCounts()
    const interval = setInterval(fetchDashboardCounts, 300000)
    return () => clearInterval(interval)
  }, [user?.id])

  // Get user's display name (prefer full name, fallback to email)
  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.email) {
      return user.email
    }
    return "User"
  }

  // Get user's avatar initials (first letter of name or email)
  const getAvatarInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  // Get member since year
  const getMemberSince = () => {
    if (user?.created_at) {
      return `Member since ${new Date(user.created_at).getFullYear()}`
    }
    return "Member"
  }

  const navItemsDynamic = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My Ads",
      href: "/dashboard/listings",
      icon: Package,
      badge: dashboardCounts.myAds > 0 ? dashboardCounts.myAds.toString() : undefined,
    },
    {
      title: "Favorites",
      href: "/dashboard/favorites",
      icon: Heart,
      badge: dashboardCounts.favorites > 0 ? dashboardCounts.favorites.toString() : undefined,
    },
    {
      title: "Messages",
      href: "/dashboard/messages",
      icon: MessageSquare,
      badge: dashboardCounts.messages > 0 ? dashboardCounts.messages.toString() : undefined,
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: TrendingUp,
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Avatar className="h-12 w-12 border-2 border-green-600">
            <AvatarImage 
              src={user?.user_metadata?.avatar_url || ""} 
              alt={getDisplayName()}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getAvatarInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{getDisplayName()}</h3>
            <p className="text-sm text-muted-foreground">
              {getMemberSince()}
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItemsDynamic.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => router.push(item.href)}
                aria-current={isActive ? "page" : undefined}
                role="link"
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.title}
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
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
