"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

        const [adsResult, favoritesResult, messagesResult] = await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("receiver_id", user.id)
            .eq("is_read", false),
        ])

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
