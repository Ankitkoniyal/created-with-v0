"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Eye, Plus, MessageSquare, TrendingUp } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface UserStats {
  activeAds: number
  totalViews: number
  totalMessages: number
  unreadMessages: number
  responseRate: number
}

interface RecentListing {
  id: string
  title: string
  price: number
  status: string
  views: number
  images: string[]
  category: string
  created_at: string
}

export function DashboardOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>({
    activeAds: 0,
    totalViews: 0,
    totalMessages: 0,
    unreadMessages: 0,
    responseRate: 0,
  })
  const [recentListings, setRecentListings] = useState<RecentListing[]>([])
  const [loading, setLoading] = useState(true)
  const [accountStatus, setAccountStatus] = useState("active")

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      const supabase = createClient()

      // Check account status
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single()
      
      if (profile?.status) {
        setAccountStatus(profile.status)
      }

      // Fetch TOTAL messages received (FIXED)
      const { count: totalMessages, error: totalMessagesError } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true })
        .eq("receiver_id", user.id) // All messages received by user

      // Fetch unread messages count
      const { count: unreadMessages, error: unreadMessagesError } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false)

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)

      if (productsError) {
        console.error("Error fetching products:", productsError)
      } else {
        const activeProducts = products?.filter((p) => p.status === "active") || []
        const totalViews = products?.reduce((sum, p) => sum + (p.views || 0), 0) || 0

        setStats({
          activeAds: activeProducts.length,
          totalViews: totalViews,
          totalMessages: totalMessages || 0, // Use total messages instead of unread
          unreadMessages: unreadMessages || 0, // Keep unread for display purposes
          responseRate: activeProducts.length > 0 ? Math.round((totalViews / activeProducts.length) * 0.1) : 0,
        })

        const recent = products?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3) || []
        setRecentListings(recent)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Real-time subscription for message updates
    const supabase = createClient()
    const subscription = supabase
      .channel('dashboard-messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`
        }, 
        () => {
          fetchDashboardData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const statsData = [
    {
      title: "Active Ads",
      value: stats.activeAds.toString(),
      change: stats.activeAds > 0 ? `${stats.activeAds} live ads` : "No active ads",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Total Views",
      value: stats.totalViews.toLocaleString(),
      change: stats.totalViews > 0 ? "Across all ads" : "Start posting ads",
      icon: Eye,
      color: "text-green-600",
    },
    {
      title: "Messages",
      value: stats.totalMessages.toString(), // Show total messages
      change: stats.unreadMessages > 0 ? `${stats.unreadMessages} unread` : "No new messages", // Show unread count in subtitle
      icon: MessageSquare,
      color: "text-purple-600",
    },
    {
      title: "Avg Views/Ad",
      value: stats.activeAds > 0 ? Math.round(stats.totalViews / stats.activeAds).toString() : "0",
      change: "Per active ad",
      icon: TrendingUp,
      color: "text-emerald-600",
    },
  ]

  // ... rest of your component remains the same
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ... rest of your JSX remains the same */}
      {accountStatus === "deactivated" && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          {/* ... deactivation warning JSX */}
        </div>
      )}

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border">
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back!</h2>
        <p className="text-muted-foreground mb-4">
          {stats.activeAds > 0
            ? `You have ${stats.activeAds} active ad${stats.activeAds !== 1 ? "s" : ""} with ${stats.totalViews} total views and ${stats.totalMessages} messages.`
            : "Ready to start selling? Post your first ad and reach millions of buyers."}
        </p>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Live data • Updated in real-time</span>
        </div>
        <Button asChild disabled={accountStatus === "deactivated"}>
          <Link href="/sell">
            <Plus className="h-4 w-4 mr-2" />
            Post New Ad
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col space-y-2" asChild disabled={accountStatus === "deactivated"}>
              <Link href="/sell">
                <Plus className="h-6 w-6" />
                <span>Post Free Ad</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent" asChild>
              <Link href="/dashboard/messages">
                <MessageSquare className="h-6 w-6" />
                <span>
                  Messages
                  {stats.unreadMessages > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {stats.unreadMessages}
                    </Badge>
                  )}
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent" asChild>
              <Link href="/dashboard/analytics">
                <TrendingUp className="h-6 w-6" />
                <span>Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
