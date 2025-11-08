"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MessageSquare } from "lucide-react"
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
  const [stats, setStats] = useState<UserStats>({ activeAds: 0, unreadMessages: 0 })
  const [recentListings, setRecentListings] = useState<RecentListing[]>([])
  const [loading, setLoading] = useState(true)
  const [accountStatus, setAccountStatus] = useState("active")
  const initialFetchDone = useRef(false)

  const fetchDashboardData = useCallback(async (opts: { showSpinner?: boolean } = {}) => {
    if (!user?.id) {
      setStats({ activeAds: 0, unreadMessages: 0 })
      setRecentListings([])
      setAccountStatus("active")
      setLoading(false)
      return
    }
    
    if (!initialFetchDone.current || opts.showSpinner) {
      setLoading(true)
    }
    
    try {
      const supabase = createClient()

      // Check account status
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("status, account_status")
        .eq("id", user.id)
        .maybeSingle()

      if (!profileError) {
        const status = profile?.status || (profile as any)?.account_status
        if (status) {
          setAccountStatus(status)
        }
      } else if (profileError.code !== "42703") {
        console.warn("[dashboard] profile status lookup failed:", profileError.message)
      }

      // Unread messages
      const { count: unreadMessages } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false)

      // Products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)

      if (productsError) console.error("Error fetching products:", productsError)

      const activeProducts = products?.filter((p) => p.status === "active") || []
      const recent = products
        ?.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 3) || []

      setStats({ activeAds: activeProducts.length, unreadMessages: unreadMessages || 0 })
      setRecentListings(recent)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
      initialFetchDone.current = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    fetchDashboardData({ showSpinner: true })
    const supabase = createClient()

    const channel = supabase
      .channel("dashboard-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${user?.id}` },
        () => fetchDashboardData()
      )
      .subscribe()

    return () => {
      channel.unsubscribe().catch(() => {})
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchDashboardData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-0 m-0">
        <div className="bg-gray-800 rounded-none p-6 border-0">
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
    <div className="min-h-screen bg-gray-900 p-0 m-0">
      {accountStatus === "deactivated" && (
        <div className="bg-red-900/20 border-0 rounded-none p-4">
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

      {/* Welcome Card */}
      <div className="bg-gray-800 rounded-none p-6 border-0">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
        <p className="text-gray-300 mb-4">
          Ready to start selling? Post your first ad and reach millions of buyers.
        </p>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Live data • Updated in real-time</span>
        </div>
        <Button
          asChild
          disabled={accountStatus === "deactivated"}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Link href="/sell">
            <Plus className="h-4 w-4 mr-2" />
            Post New Ad
          </Link>
        </Button>
      </div>

      {/* Recent Listings */}
      {recentListings.length > 0 && (
        <div className="bg-gray-800 rounded-none p-6 border-0 border-t border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Your Recent Listings</h3>
          <div className="space-y-3">
            {recentListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {listing.images && listing.images.length > 0 ? (
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                      <div className="h-6 w-6 text-gray-400">📷</div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                      <div className="h-6 w-6 text-gray-400">📦</div>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-white">{listing.title}</h4>
                    <p className="text-sm text-gray-400">{listing.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">${listing.price}</div>
                  <div className="text-xs text-gray-400">{listing.views} views</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
