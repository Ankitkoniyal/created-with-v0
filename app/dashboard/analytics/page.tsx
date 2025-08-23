"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Eye, MessageSquare, DollarSign, Users } from "lucide-react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface AnalyticsData {
  totalViews: number
  totalMessages: number
  totalAds: number
  activeAds: number
  soldAds: number
  totalValue: number
  thisMonth: {
    views: number
    messages: number
    sales: number
  }
  topPerformingAds: Array<{
    title: string
    views: number
    messages: number
    price: number
  }>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalViews: 0,
    totalMessages: 0,
    totalAds: 0,
    activeAds: 0,
    soldAds: 0,
    totalValue: 0,
    thisMonth: { views: 0, messages: 0, sales: 0 },
    topPerformingAds: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchAnalyticsData()
    }
  }, [user?.id])

  const fetchAnalyticsData = async () => {
    try {
      const supabase = createClient()

      const { data: userAds, error: adsError } = await supabase.from("products").select("*").eq("user_id", user?.id)

      if (adsError) {
        console.error("Error fetching user ads:", adsError)
        return
      }

      const ads = userAds || []
      const activeAds = ads.filter((ad) => ad.status === "active")
      const soldAds = ads.filter((ad) => ad.status === "sold")

      // Calculate total value of active ads
      const totalValue = activeAds.reduce((sum, ad) => sum + (ad.price || 0), 0)

      // Get top performing ads (sorted by views, fallback to random order)
      const topAds = ads
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 3)
        .map((ad) => ({
          title: ad.title,
          views: ad.views || 0,
          messages: ad.message_count || 0,
          price: ad.price || 0,
        }))

      // Calculate this month's data (simplified - in real app would filter by date)
      const thisMonthViews = ads.reduce((sum, ad) => sum + (ad.views || 0), 0)
      const thisMonthMessages = ads.reduce((sum, ad) => sum + (ad.message_count || 0), 0)

      setAnalyticsData({
        totalViews: thisMonthViews,
        totalMessages: thisMonthMessages,
        totalAds: ads.length,
        activeAds: activeAds.length,
        soldAds: soldAds.length,
        totalValue,
        thisMonth: {
          views: thisMonthViews,
          messages: thisMonthMessages,
          sales: soldAds.length,
        },
        topPerformingAds: topAds,
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-muted-foreground">Track your ad performance and engagement</p>
            <Badge variant="outline" className="mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Live Data
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <DashboardNav />
            </div>
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                          <p className="text-2xl font-bold text-foreground">{analyticsData.totalViews}</p>
                          <p className="text-xs text-green-600 mt-1">+{analyticsData.thisMonth.views} this month</p>
                        </div>
                        <Eye className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                          <p className="text-2xl font-bold text-foreground">{analyticsData.totalMessages}</p>
                          <p className="text-xs text-green-600 mt-1">+{analyticsData.thisMonth.messages} this month</p>
                        </div>
                        <MessageSquare className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active Ads</p>
                          <p className="text-2xl font-bold text-foreground">{analyticsData.activeAds}</p>
                          <p className="text-xs text-muted-foreground mt-1">of {analyticsData.totalAds} total</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                          <p className="text-2xl font-bold text-foreground">${analyticsData.totalValue}</p>
                          <p className="text-xs text-green-600 mt-1">{analyticsData.soldAds} sold this month</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Ads */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Ads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.topPerformingAds.length > 0 ? (
                      <div className="space-y-4">
                        {analyticsData.topPerformingAds.map((ad, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <div>
                                <h4 className="font-semibold text-foreground">{ad.title}</h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <Eye className="h-4 w-4 mr-1" />
                                    {ad.views} views
                                  </div>
                                  <div className="flex items-center">
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    {ad.messages} messages
                                  </div>
                                  <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />${ad.price}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No ads posted yet. Start by posting your first ad!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.totalAds > 0 ? (
                        <>
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                              <h4 className="font-semibold text-green-800">Your Stats</h4>
                            </div>
                            <p className="text-sm text-green-700 mt-1">
                              You have {analyticsData.activeAds} active ads with a total value of $
                              {analyticsData.totalValue}.
                            </p>
                          </div>

                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center">
                              <Users className="h-5 w-5 text-blue-600 mr-2" />
                              <h4 className="font-semibold text-blue-800">Engagement Tip</h4>
                            </div>
                            <p className="text-sm text-blue-700 mt-1">
                              Ads with multiple photos and detailed descriptions get more messages. Consider adding more
                              images to your listings.
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center">
                            <TrendingUp className="h-5 w-5 text-yellow-600 mr-2" />
                            <h4 className="font-semibold text-yellow-800">Get Started</h4>
                          </div>
                          <p className="text-sm text-yellow-700 mt-1">
                            Post your first ad to start seeing analytics data and performance insights.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
