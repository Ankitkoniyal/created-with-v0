"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Package, Heart, User, Settings, MessageSquare, TrendingUp } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Ads", // Updated from "My Listings" to "My Ads"
    href: "/dashboard/listings",
    icon: Package,
    badge: "3",
  },
  {
    title: "Favorites",
    href: "/dashboard/favorites",
    icon: Heart,
    badge: "12",
  },
  {
    title: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    badge: "2",
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
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        // Fetch user's ads count
        const { count: adsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Fetch favorites count
        const { count: favoritesCount } = await supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        // Fetch messages count (unread messages)
        const { count: messagesCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("is_read", false)

        setDashboardCounts({
          myAds: adsCount || 0,
          favorites: favoritesCount || 0,
          messages: messagesCount || 0,
        })
      } catch (error) {
        console.error("Error fetching dashboard counts:", error)
        // Keep default values on error
      }
    }

    fetchDashboardCounts()

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchDashboardCounts, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

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
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary font-semibold">
              {user?.full_name
                ? user.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "U"}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{user?.full_name || "User"}</h3>
            <p className="text-sm text-muted-foreground">
              Member since {user?.created_at ? new Date(user.created_at).getFullYear() : "Recently"}
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItemsDynamic.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  router.push(item.href)
                }}
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
