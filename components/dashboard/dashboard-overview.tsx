"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Eye, Plus, MessageSquare, TrendingUp, Edit } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import { getOptimizedImageUrl } from "@/lib/images"

interface UserStats {
  activeAds: number
  totalViews: number
  totalMessages: number
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
    responseRate: 0,
  })
  const [recentListings, setRecentListings] = useState<RecentListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        const supabase = createClient()

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
            totalMessages: 0,
            responseRate: activeProducts.length > 0 ? Math.round((totalViews / activeProducts.length) * 0.1) : 0,
          })

          // Show ALL products in recent listings, not just active ones
          const recent = products?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3) || []
          setRecentListings(recent)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
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
      value: stats.totalMessages.toString(),
      change: "Coming soon",
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
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border">
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back!</h2>
        <p className="text-muted-foreground mb-4">
          {stats.activeAds > 0
            ? `You have ${stats.activeAds} active ad${stats.activeAds !== 1 ? "s" : ""} with ${stats.totalViews} total views.`
            : "Ready to start selling? Post your first ad and reach millions of buyers."}
        </p>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Live data • Updated in real-time</span>
        </div>
        <Button asChild>
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

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/sell">
                <Plus className="h-6 w-6" />
                <span>Post Free Ad</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent" asChild>
              <Link href="/dashboard/messages">
                <MessageSquare className="h-6 w-6" />
                <span>Messages</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2 bg-transparent" asChild>
              <Link href="/dashboard/listings">
                <Package className="h-6 w-6" />
                <span>Manage Ads</span>
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

      {recentListings.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Recent Ads</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/listings">View All Ads</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Image
                    src={getOptimizedImageUrl(listing.images?.[0], "thumb") || "/placeholder.svg"}
                    alt={listing.title}
                    width={80}
                    height={80}
                    className="object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-foreground">{listing.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {listing.category}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold text-primary">${listing.price.toLocaleString()}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {listing.views || 0} views
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />0 messages
                      </div>
                      <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant={
                      listing.status === "active" ? "default" :
                      listing.status === "sold" ? "destructive" :
                      listing.status === "draft" ? "outline" : "secondary"
                    }>
                      {listing.status}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-transparent" asChild>
                        <Link href={`/product/${listing.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-transparent" asChild>
                        <Link href="/dashboard/listings">
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recentListings.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No ads yet</h3>
            <p className="text-muted-foreground mb-4">
              Post your first ad to start selling and reach millions of potential buyers.
            </p>
            <Button asChild>
              <Link href="/sell">Post Your First Ad</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ad Performance Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Add more photos</p>
                  <p className="text-sm text-muted-foreground">Ads with 3+ photos get 40% more views</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Update descriptions</p>
                  <p className="text-sm text-muted-foreground">Detailed descriptions increase buyer interest</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Respond quickly</p>
                  <p className="text-sm text-muted-foreground">Fast responses lead to more sales</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalViews > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Eye className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Your ads have {stats.totalViews} total views</p>
                    <p className="text-sm text-muted-foreground">Keep posting to increase visibility</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{stats.activeAds} active ads</p>
                    <p className="text-sm text-muted-foreground">Manage your listings for better results</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No activity yet. Post your first ad to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
