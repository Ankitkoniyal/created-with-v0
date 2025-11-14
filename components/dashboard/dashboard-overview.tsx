"use client"

import { useState, useEffect } from "react"
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
  const [accountStatus, setAccountStatus] = useState<string>(
    (user?.user_metadata?.account_status as string) || "active",
  )

  const fetchDashboardData = async () => {
    if (!user) {
      setStats({ activeAds: 0, unreadMessages: 0 })
      setRecentListings([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()

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
    }
  }

  useEffect(() => {
    let isMounted = true
    const initialise = async () => {
      await fetchDashboardData()
      if (isMounted) {
        setAccountStatus((user?.user_metadata?.account_status as string) || "active")
      }
    }

    initialise()

    if (!user?.id) {
      return () => {
        isMounted = false
      }
    }

    const supabase = createClient()
    const channel = supabase
      .channel("dashboard-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => fetchDashboardData(),
      )
      .subscribe()

    return () => {
      isMounted = false
      channel.unsubscribe()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card p-6 border border-border rounded-lg shadow-sm">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
            <div className="h-10 bg-muted rounded w-32"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {accountStatus === "deactivated" && (
        <div className="mx-auto mb-6 max-w-4xl rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-700">Account Deactivated</h3>
              <p className="mt-1 text-sm text-red-600">
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
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">Overview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quick snapshot of your account performance
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button asChild>
              <Link href="/sell">
                <Plus className="h-4 w-4 mr-2" />
                Post New Ad
              </Link>
            </Button>
            <Button variant="outline" className="hover:bg-muted">
              <Link href="/dashboard/listings">View All</Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-border/60 bg-muted/40">
            <CardHeader>
              <CardTitle>Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-2xl font-bold text-white">{stats.activeAds}</h3>
              <p className="text-sm text-muted-foreground">Active Ads</p>
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-muted/40">
            <CardHeader>
              <CardTitle>Unread Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-2xl font-bold text-white">{stats.unreadMessages}</h3>
              <p className="text-sm text-muted-foreground">Unread Messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Listings */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">Recent Listings</h3>
            <Button asChild variant="outline" className="hover:bg-muted">
              <Link href="/dashboard/listings">View All</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentListings.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-center text-muted-foreground">
                No recent listings. Start by creating a new listing!
              </div>
            ) : (
              recentListings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{listing.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Updated {new Date(listing.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge>{listing.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
