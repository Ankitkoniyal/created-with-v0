"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Plus, MessageSquare } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface UserStats {
  activeAds: number
  unreadMessages: number
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
    unreadMessages: 0,
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

        setStats({
          activeAds: activeProducts.length,
          unreadMessages: unreadMessages || 0,
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3 mb-4"></div>
            <div className="h-10 bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {accountStatus === "deactivated" && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-400">Account Deactivated</h3>
              <p className="text-red-300 text-sm mt-1">
                Your account has been deactivated. You cannot post new ads or send messages.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-red-800 text-red-400">
              Contact Support
            </Button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
        <p className="text-white mb-4">
          Ready to start selling? Post your first ad and reach millions of buyers.
        </p>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-300">Live data • Updated in real-time</span>
        </div>
        <Button asChild disabled={accountStatus === "deactivated"} className="bg-gray-700 text-white hover:bg-gray-700">
          <Link href="/sell">
            <Plus className="h-4 w-4 mr-2" />
            Post New Ad
          </Link>
        </Button>
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader className="bg-gray-900 border-b border-gray-700">
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="h-20 flex flex-col space-y-2 bg-gray-700 text-white hover:bg-gray-700" asChild disabled={accountStatus === "deactivated"}>
              <Link href="/sell">
                <Plus className="h-6 w-6" />
                <span>Post Free Ad</span>
              </Link>
            </Button>
            <Button className="h-20 flex flex-col space-y-2 bg-gray-700 text-white hover:bg-gray-700 border-0" asChild>
              <Link href="/dashboard/messages">
                <MessageSquare className="h-6 w-6" />
                <span className="text-white">
                  Messages
                  {stats.unreadMessages > 0 && (
                    <Badge variant="destructive" className="ml-2 bg-red-500 text-white">
                      {stats.unreadMessages}
                    </Badge>
                  )}
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
