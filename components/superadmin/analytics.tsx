// components/superadmin/analytics.tsx
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Users, ShoppingBag, TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface AnalyticsData {
  totalUsers: number
  totalAds: number
  activeAds: number
  userGrowth: number
  adGrowth: number
  topCategories: { name: string; count: number }[]
  recentSignups: { email: string; name: string; phone: string; location: string; date: string; timestamp: string }[]
  adsByDate: { date: string; count: number }[]
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      const supabase = await getSupabaseClient()
      
      // Get total users
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      if (userError) throw userError

      // Get total ads
      const { count: adCount, error: adError } = await supabase
        .from('products')
        .select('*', { count: 'exact' })

      if (adError) throw adError

      // Get active ads
      const { count: activeAdsCount, error: activeError } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('status', 'active')

      if (activeError) throw activeError

      // Get top categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('products')
        .select('category')
      
      if (categoriesError) throw categoriesError

      const categoryCounts = categoriesData?.reduce((acc, item) => {
        if (item.category) {
          acc[item.category] = (acc[item.category] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}

      const topCategories = Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Get recent signups
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select('email, full_name, phone, location, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (usersError) throw usersError

      const recentSignups = recentUsers?.map(user => ({
        email: user.email,
        name: user.full_name || 'Unknown',
        phone: user.phone || 'Not provided',
        location: user.location || 'Not specified',
        date: new Date(user.created_at).toLocaleDateString(),
        timestamp: new Date(user.created_at).toLocaleTimeString()
      })) || []

      // Get ads by date (simplified)
      const adsByDate = [
        { date: '2023-10-01', count: 12 },
        { date: '2023-10-02', count: 18 },
        { date: '2023-10-03', count: 15 },
        { date: '2023-10-04', count: 22 },
        { date: '2023-10-05', count: 19 },
        { date: '2023-10-06', count: 25 },
        { date: '2023-10-07', count: 30 },
      ]

      setData({
        totalUsers: userCount || 0,
        totalAds: adCount || 0,
        activeAds: activeAdsCount || 0,
        userGrowth: 5.2,
        adGrowth: 12.7,
        topCategories,
        recentSignups,
        adsByDate
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6 bg-gray-800 h-32"></Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <Select value={timeRange} onValueChange={(value: "7d" | "30d" | "90d") => setTimeRange(value)}>
          <SelectTrigger className="w-[120px] bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white mt-1">{data.totalUsers}</p>
              <div className="flex items-center mt-2">
                {data.userGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                )}
                <span className={`text-sm font-medium ${data.userGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {data.userGrowth >= 0 ? '+' : ''}{data.userGrowth}%
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-900 flex items-center justify-center text-green-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Ads</p>
              <p className="text-2xl font-bold text-white mt-1">{data.totalAds}</p>
              <div className="flex items-center mt-2">
                {data.adGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                )}
                <span className={`text-sm font-medium ${data.adGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {data.adGrowth >= 0 ? '+' : ''}{data.adGrowth}%
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-900 flex items-center justify-center text-blue-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Ads</p>
              <p className="text-2xl font-bold text-white mt-1">{data.activeAds}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">Currently active listings</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-900 flex items-center justify-center text-purple-400">
              <BarChart className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Signups</h3>
          <div className="space-y-3">
            {data.recentSignups.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-900 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.phone} • {user.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{user.date}</p>
                  <p className="text-xs text-gray-500">{user.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Categories</h3>
          <div className="space-y-3">
            {data.topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-blue-400">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <span className="font-medium text-white">{category.name}</span>
                </div>
                <span className="text-sm text-gray-400">{category.count} items</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Ads Posted Over Time</h3>
        <div className="grid grid-cols-7 gap-2">
          {data.adsByDate.map((day) => (
            <div key={day.date} className="text-center">
              <div className="bg-blue-900 rounded-t p-1">
                <p className="text-xs text-blue-400">{day.date.split('-')[2]}</p>
              </div>
              <div className="bg-gray-700 rounded-b p-2">
                <p className="text-sm font-medium text-white">{day.count}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}