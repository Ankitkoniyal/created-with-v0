"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MessageSquare, Eye, DollarSign, Calendar, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
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

      // Unread messages - with proper error handling
      let unreadMessages = 0
      try {
        const { count, error: messagesError } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .eq("is_read", false)

        if (messagesError) {
          console.error("Error fetching unread messages:", messagesError.message || messagesError)
        } else {
          unreadMessages = count || 0
        }
      } catch (messagesErr) {
        console.error("Exception fetching messages:", messagesErr)
      }

      // Products - with proper error handling
      let products: any[] = []
      try {
        const { data, error: productsError } = await supabase
          .from("products")
          .select("id, title, price, status, views, images, category, created_at, updated_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (productsError) {
          console.error("Error fetching products:", productsError.message || productsError.code || productsError)
        } else {
          products = data || []
        }
      } catch (productsErr) {
        console.error("Exception fetching products:", productsErr)
      }

      const activeProducts = products.filter((p) => p.status === "active")
      const recent = products.slice(0, 5) // Show top 5 most recent

      setStats({ activeAds: activeProducts.length, unreadMessages })
      setRecentListings(recent)
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error?.message || error)
      // Set defaults on error
      setStats({ activeAds: 0, unreadMessages: 0 })
      setRecentListings([])
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
              <h3 className="text-2xl font-bold text-foreground">{stats.activeAds}</h3>
              <p className="text-sm text-muted-foreground">Active Ads</p>
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-muted/40">
            <CardHeader>
              <CardTitle>Unread Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{stats.unreadMessages}</h3>
                  <p className="text-sm text-muted-foreground">Unread Messages</p>
                </div>
                {stats.unreadMessages > 0 && (
                  <Button asChild variant="outline" size="sm" className="ml-4">
                    <Link href="/dashboard/messages">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </Button>
                )}
              </div>
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
              recentListings.map((listing) => {
                const imageUrl = Array.isArray(listing.images) && listing.images.length > 0 
                  ? listing.images[0] 
                  : null
                const formattedPrice = listing.price 
                  ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(listing.price)
                  : 'N/A'
                const daysAgo = Math.floor((new Date().getTime() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24))
                const timeAgo = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`

                return (
                  <Link 
                    key={listing.id} 
                    href={`/product/${listing.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="relative flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden bg-muted border border-border">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={listing.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{listing.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formattedPrice}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {listing.views || 0} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {timeAgo}
                          </span>
                        </div>
                        {listing.category && (
                          <p className="text-xs text-muted-foreground mt-1">Category: {listing.category}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <Badge 
                        variant={listing.status === "active" ? "default" : listing.status === "pending" ? "secondary" : "outline"}
                        className="whitespace-nowrap"
                      >
                        {listing.status || "active"}
                      </Badge>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
