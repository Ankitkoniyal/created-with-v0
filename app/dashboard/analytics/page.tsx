"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Eye, MessageSquare, DollarSign, Users } from "lucide-react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AuthGuard } from "@/components/auth/auth-guard"

// Mock analytics data
const analyticsData = {
  totalViews: 1247,
  totalMessages: 23,
  totalAds: 8,
  activeAds: 5,
  soldAds: 3,
  totalValue: 2450,
  thisMonth: {
    views: 342,
    messages: 8,
    sales: 2,
  },
  topPerformingAds: [
    { title: "iPhone 14 Pro Max", views: 156, messages: 8 },
    { title: "Gaming Laptop RTX 3070", views: 89, messages: 5 },
    { title: "Vintage Leather Jacket", views: 67, messages: 3 },
  ],
}

export default function AnalyticsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-muted-foreground">Track your ad performance and engagement</p>
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
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                          <h4 className="font-semibold text-green-800">Great Performance!</h4>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Your ads are getting 23% more views than average this month.
                        </p>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-blue-600 mr-2" />
                          <h4 className="font-semibold text-blue-800">Engagement Tip</h4>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Ads with multiple photos get 40% more messages. Consider adding more images to your listings.
                        </p>
                      </div>
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
