// components/superadmin/analytics.tsx
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Users,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  PieChart,
  RefreshCw,
  Globe2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface SignupRow {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  location: string | null
  created_at: string
}

interface ProductRow {
  category: string | null
  created_at: string
  status: string | null
  views: number | null
}

type RangeOption = "7d" | "30d" | "90d"

interface Metrics {
  totalUsers: number
  totalAds: number
  activeAds: number
  newUsers: number
  newAds: number
  userGrowth: number
  adGrowth: number
  activeRatio: number
  topCategories: { name: string; count: number }[]
  topLocations: { name: string; count: number }[]
  recentSignups: Array<{
    email: string
    name: string
    phone: string
    location: string
    date: string
    time: string
  }>
  adsByDate: Array<{ date: string; count: number }>
}

const RANGE_LABELS: Record<RangeOption, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
}

const formatNumber = (value: number) => new Intl.NumberFormat().format(value)

const computeGrowth = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

const groupCounts = (items: (string | null)[] = []) => {
  const counts = new Map<string, number>()
  items
    .filter(Boolean)
    .forEach((value) => {
      if (!value) return
      counts.set(value, (counts.get(value) ?? 0) + 1)
    })
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

const mergeTimeSeries = (rows: ProductRow[], start: Date, end: Date) => {
  const bucket = new Map<string, number>()
  const cursor = new Date(start)
  while (cursor <= end) {
    bucket.set(cursor.toISOString().slice(0, 10), 0)
    cursor.setDate(cursor.getDate() + 1)
  }

  rows.forEach((row) => {
    const dateKey = new Date(row.created_at).toISOString().slice(0, 10)
    if (bucket.has(dateKey)) {
      bucket.set(dateKey, (bucket.get(dateKey) ?? 0) + 1)
    }
  })

  return Array.from(bucket.entries()).map(([date, count]) => ({ date, count }))
}

export function Analytics() {
  const supabase = createClient()
  const [range, setRange] = useState<RangeOption>("30d")
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    const now = new Date()
    const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : 90
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - rangeDays)

    const prevEnd = new Date(startDate)
    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - rangeDays)

    try {
      const [
        totalUsers,
        totalAds,
        activeAds,
        newUsersRes,
        prevUsersRes,
        newAdsRes,
        prevAdsRes,
        productsRes,
        recentUsersRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())
          .lt("created_at", now.toISOString()),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", prevStart.toISOString())
          .lt("created_at", prevEnd.toISOString()),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())
          .lt("created_at", now.toISOString()),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .gte("created_at", prevStart.toISOString())
          .lt("created_at", prevEnd.toISOString()),
        supabase
          .from("products")
          .select("category, created_at, status, views")
          .gte("created_at", startDate.toISOString())
          .lt("created_at", now.toISOString()),
        supabase
          .from("profiles")
          .select("id, email, full_name, phone, location, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ])

      // Collect all errors
      const errors = [
        totalUsers.error,
        totalAds.error,
        activeAds.error,
        newUsersRes.error,
        prevUsersRes.error,
        newAdsRes.error,
        prevAdsRes.error,
        productsRes.error,
        recentUsersRes.error,
      ].filter(Boolean)

      if (errors.length > 0) {
        console.error("Analytics query errors:", errors)
        // Use first error but don't fail completely - use defaults for missing data
        const firstError = errors[0] as any
        if (firstError?.code === "42501" || firstError?.code === "42703") {
          // RLS or column issues - set defaults and continue
          console.warn("Some analytics queries failed due to permissions or missing columns, using defaults")
        } else {
          throw firstError
        }
      }

      const newUsers = newUsersRes.count ?? 0
      const previousUsers = prevUsersRes.count ?? 0
      const newAds = newAdsRes.count ?? 0
      const previousAds = prevAdsRes.count ?? 0

      const products = (productsRes.data as ProductRow[]) ?? []
      const topCategories = groupCounts(products.map((item) => item.category)).slice(0, 5)
      
      // Safely get locations from recent users
      const recentUsersData = (recentUsersRes.data as SignupRow[] | null) ?? []
      const topLocations = groupCounts(
        recentUsersData.map((user) => user.location).filter(Boolean) ?? [],
      ).slice(0, 5)

      const recentSignups = recentUsersData.map((user) => ({
        email: user.email || "No email",
        name: user.full_name || "Unknown",
        phone: user.phone || "—",
        location: user.location || "Unspecified",
        date: new Date(user.created_at).toLocaleDateString(),
        time: new Date(user.created_at).toLocaleTimeString(),
      }))

      const adsByDate = mergeTimeSeries(products, startDate, now)

      setMetrics({
        totalUsers: totalUsers.count ?? 0,
        totalAds: totalAds.count ?? 0,
        activeAds: activeAds.count ?? 0,
        newUsers,
        newAds,
        userGrowth: computeGrowth(newUsers, previousUsers),
        adGrowth: computeGrowth(newAds, previousAds),
        activeRatio: totalAds.count ? (activeAds.count ?? 0) / totalAds.count : 0,
        topCategories,
        topLocations,
        recentSignups,
        adsByDate,
      })
    } catch (err: any) {
      console.error("Analytics load failed", err)
      setError(err.message || "Failed to load analytics")
      setMetrics(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase, range])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  useEffect(() => {
    const channel = supabase
      .channel("super-admin-analytics")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => loadAnalytics())
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => loadAnalytics())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadAnalytics])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
  }

  const formatter = useMemo(() => new Intl.NumberFormat(), [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-sm text-gray-400">Loading latest metrics…</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, idx) => (
            <Card key={idx} className="bg-gray-800 border-gray-700 animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, idx) => (
            <Card key={idx} className="bg-gray-800 border-gray-700 animate-pulse">
              <CardContent className="h-64" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <Button variant="outline" onClick={handleManualRefresh} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </Button>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-sm text-gray-400">
            Platform health at a glance • {RANGE_LABELS[range]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(value: RangeOption) => setRange(value)}>
            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-white">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleManualRefresh} disabled={refreshing} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          iconClass="bg-emerald-900 text-emerald-300"
          label="Total users"
          primary={formatter.format(metrics.totalUsers)}
          delta={metrics.userGrowth}
        />
        <StatCard
          icon={ShoppingBag}
          iconClass="bg-blue-900 text-blue-300"
          label="Total ads"
          primary={formatter.format(metrics.totalAds)}
          delta={metrics.adGrowth}
        />
        <StatCard
          icon={BarChart}
          iconClass="bg-purple-900 text-purple-300"
          label="Active ads"
          primary={formatter.format(metrics.activeAds)}
          helper={`${(metrics.activeRatio * 100).toFixed(1)}% of inventory`}
        />
        <StatCard
          icon={Activity}
          iconClass="bg-orange-900 text-orange-300"
          label="New ads"
          primary={formatter.format(metrics.newAds)}
          helper={`${formatter.format(metrics.newUsers)} new users`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base text-white">Recent signups</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.recentSignups.length === 0 ? (
              <p className="text-sm text-gray-400">No signups in this range.</p>
            ) : (
              metrics.recentSignups.map((signup) => (
                <div
                  key={signup.email + signup.date}
                  className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-900/60 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">{signup.name}</p>
                    <p className="text-gray-400">{signup.email}</p>
                    <p className="text-xs text-gray-500">
                      {signup.phone} • {signup.location}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div>{signup.date}</div>
                    <div>{signup.time}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base text-white">Top categories</CardTitle>
            <PieChart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.topCategories.length === 0 ? (
              <p className="text-sm text-gray-400">No category activity in this range.</p>
            ) : (
              metrics.topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-blue-300">
                      {index + 1}
                    </div>
                    <span className="font-medium text-white">{category.name}</span>
                  </div>
                  <span className="text-gray-400">{formatter.format(category.count)} ads</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base text-white">Active regions</CardTitle>
            <Globe2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.topLocations.length === 0 ? (
              <p className="text-sm text-gray-400">No location data captured.</p>
            ) : (
              metrics.topLocations.map((location) => (
                <div key={location.name} className="flex items-center justify-between text-sm">
                  <span className="text-white">{location.name}</span>
                  <span className="text-gray-400">{formatter.format(location.count)} users</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-base text-white">Ads posted over time</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.adsByDate.length === 0 ? (
              <p className="text-sm text-gray-400">No listings created in this range.</p>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {metrics.adsByDate.slice(-7).map((day) => (
                  <div key={day.date} className="flex flex-col items-center text-xs text-gray-400">
                    <div className="h-16 w-full rounded bg-blue-900/40">
                      <div
                        className="flex h-full w-full items-end justify-center"
                        style={{
                          height: "100%",
                        }}
                      >
                        <div
                          className="w-full rounded bg-blue-500"
                          style={{
                            height: `${Math.min(100, day.count * 12)}%`,
                            minHeight: day.count > 0 ? "4px" : "0",
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-1 text-white">{day.count}</div>
                    <div>{day.date.slice(5)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  iconClass,
  label,
  primary,
  delta,
  helper,
}: {
  icon: React.ElementType
  iconClass: string
  label: string
  primary: string
  delta?: number
  helper?: string
}) {
  const positive = delta !== undefined && delta >= 0
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{primary}</p>
            {helper && <p className="text-xs text-gray-500">{helper}</p>}
            {delta !== undefined && (
              <p className={cn("mt-2 flex items-center text-sm", positive ? "text-emerald-400" : "text-red-400")}
              >
                {positive ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                {positive && "+"}
                {delta}% vs previous
              </p>
            )}
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", iconClass)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}