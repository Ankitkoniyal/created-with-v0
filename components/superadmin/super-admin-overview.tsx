// components/superadmin/super-admin-overview.tsx
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  FileText,
  Eye,
  Clock,
  Flag,
  CheckCircle,
  BarChart3,
  UserPlus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type RangeOption = "7d" | "30d" | "90d"

interface DashboardStats {
  totalUsers: number
  totalAds: number
  activeAds: number
  pendingReview: number
  reportedAds: number
  newUsers: number
  newAds: number
  userGrowth: number
  adGrowth: number
}

interface RecentUser {
  id: string
  email: string
  created_at: string
  full_name?: string | null
}

interface PendingAd {
  id: string
  title: string
  created_at: string
  category: string | null
  user_email: string
}

interface ReportSummary {
  id: string
  product_id: string
  reason: string | null
  created_at: string
  title: string | null
  user_email: string | null
}

interface SignupPoint {
  date: string
  count: number
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

const buildRange = (range: RangeOption) => {
  const now = new Date()
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
  const start = new Date(now)
  start.setDate(start.getDate() - days)
  const prevEnd = new Date(start)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - days)
  return { start, end: now, prevStart, prevEnd }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export interface SuperAdminOverviewProps {
  stats?: Partial<DashboardStats>
  onNavigate: (view: string, id?: string) => void
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalAds: 0,
  activeAds: 0,
  pendingReview: 0,
  reportedAds: 0,
  newUsers: 0,
  newAds: 0,
  userGrowth: 0,
  adGrowth: 0,
}

export function SuperAdminOverview({ stats = defaultStats, onNavigate }: SuperAdminOverviewProps) {
  const supabase = createClient()
  const [range, setRange] = useState<RangeOption>("7d")
  const [overview, setOverview] = useState<DashboardStats>({ ...defaultStats, ...stats })
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [pendingAds, setPendingAds] = useState<PendingAd[]>([])
  const [reportedItems, setReportedItems] = useState<ReportSummary[]>([])
  const [signupSeries, setSignupSeries] = useState<SignupPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOverview = useCallback(async () => {
    const { start, end, prevStart, prevEnd } = buildRange(range)
    setLoading(true)

    try {
      const [
        totalUsersRes,
        totalAdsRes,
        activeAdsRes,
        pendingAdsRes,
        reportedRes,
        newUsersRes,
        prevUsersRes,
        newAdsRes,
        prevAdsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head:true }),
        supabase
          .from("products")
          .select("id", { count: "exact", head:true })
          .eq("status", "active"),
        supabase
          .from("products")
          .select("id", { count: "exact", head:true })
          .eq("status", "pending"),
        supabase.from("reports").select("id", { count: "exact", head:true }),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head:true })
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString()),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head:true })
          .gte("created_at", prevStart.toISOString())
          .lt("created_at", prevEnd.toISOString()),
        supabase
          .from("products")
          .select("id", { count: "exact", head:true })
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString()),
        supabase
          .from("products")
          .select("id", { count: "exact", head:true })
          .gte("created_at", prevStart.toISOString())
          .lt("created_at", prevEnd.toISOString()),
      ])

      if (
        totalUsersRes.error ||
        totalAdsRes.error ||
        activeAdsRes.error ||
        pendingAdsRes.error ||
        reportedRes.error ||
        newUsersRes.error ||
        prevUsersRes.error ||
        newAdsRes.error ||
        prevAdsRes.error
      ) {
        throw (
          totalUsersRes.error ||
          totalAdsRes.error ||
          activeAdsRes.error ||
          pendingAdsRes.error ||
          reportedRes.error ||
          newUsersRes.error ||
          prevUsersRes.error ||
          newAdsRes.error ||
          prevAdsRes.error
        )
      }

      const newOverview: DashboardStats = {
        totalUsers: totalUsersRes.count ?? 0,
        totalAds: totalAdsRes.count ?? 0,
        activeAds: activeAdsRes.count ?? 0,
        pendingReview: pendingAdsRes.count ?? 0,
        reportedAds: reportedRes.count ?? 0,
        newUsers: newUsersRes.count ?? 0,
        newAds: newAdsRes.count ?? 0,
        userGrowth: computeGrowth(newUsersRes.count ?? 0, prevUsersRes.count ?? 0),
        adGrowth: computeGrowth(newAdsRes.count ?? 0, prevAdsRes.count ?? 0),
      }

      setOverview(newOverview)
    } catch (err) {
      console.error("Failed to load overview", err)
      toast.error("Failed to load dashboard stats")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase, range])

  const fetchRecentUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, created_at, full_name")
      .order("created_at", { ascending: false })
      .limit(5)
    if (!error) {
      setRecentUsers((data as RecentUser[]) ?? [])
    }
  }, [supabase])

  const fetchPendingAds = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, category, created_at, user_id")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5)

    if (error || !data?.length) {
      setPendingAds([])
      return
    }

    const userIds = Array.from(new Set(data.map((ad) => ad.user_id)))
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds)

    const emailMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.email]))

    setPendingAds(
      data.map((ad) => ({
        id: ad.id,
        title: ad.title,
        created_at: ad.created_at,
        category: ad.category ?? "Uncategorized",
        user_email: emailMap.get(ad.user_id) ?? "Unknown user",
      })),
    )
  }, [supabase])

  const fetchReportedContent = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/reports/list?limit=25")
      if (!response.ok) {
        setReportedItems([])
        return
      }

      const payload = await response.json()
      if (payload.warning === "reports_table_missing" || !Array.isArray(payload.ads)) {
        setReportedItems([])
        return
      }

      const flattened: ReportSummary[] = payload.ads
        .flatMap((ad: any) =>
          (ad.reports ?? []).map((report: any) => ({
            id: report.id,
            product_id: ad.id,
            reason: report.reason ?? "No reason provided",
            created_at: report.created_at,
            title: ad.title ?? "Untitled",
            user_email: ad.user_email ?? "Unknown",
          })),
        )
        .sort(
          (a: ReportSummary, b: ReportSummary) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5)

      setReportedItems(flattened)
    } catch (error) {
      console.error("Failed to load reported content", error)
      setReportedItems([])
    }
  }, [])

  const fetchSignupSeries = useCallback(async () => {
    const { start, end } = buildRange(range)
    const { data, error } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true })

    if (error || !data) {
      setSignupSeries([])
      return
    }

    const aggregation = new Map<string, number>()
    data.forEach((row) => {
      const key = row.created_at.slice(0, 10)
      aggregation.set(key, (aggregation.get(key) ?? 0) + 1)
    })

    const points = Array.from(aggregation.entries()).map(([date, count]) => ({ date, count }))
    setSignupSeries(points)
  }, [supabase, range])

  useEffect(() => {
    const hydrate = async () => {
      await Promise.all([
        fetchOverview(),
        fetchRecentUsers(),
        fetchPendingAds(),
        fetchReportedContent(),
        fetchSignupSeries(),
      ])
    }
    hydrate()
  }, [fetchOverview, fetchRecentUsers, fetchPendingAds, fetchReportedContent, fetchSignupSeries])

  useEffect(() => {
    const channel = supabase
      .channel("super-admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchOverview()
        fetchRecentUsers()
        fetchSignupSeries()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchOverview()
        fetchPendingAds()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        fetchOverview()
        fetchReportedContent()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchOverview, fetchPendingAds, fetchRecentUsers, fetchReportedContent, fetchSignupSeries])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchOverview(),
      fetchRecentUsers(),
      fetchPendingAds(),
      fetchReportedContent(),
      fetchSignupSeries(),
    ])
    toast.success("Dashboard refreshed")
  }

  const rangeLabel = useMemo(() => RANGE_LABELS[range], [range])
  const signupMax = signupSeries.reduce((max, point) => Math.max(max, point.count), 0)

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
          <span className="text-sm text-gray-300">Preparing overview…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-400">Key platform metrics • {rangeLabel}</p>
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
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <StatCard icon={Users} title="Total users" value={formatNumber(overview.totalUsers)} />
        <StatCard icon={FileText} title="Total ads" value={formatNumber(overview.totalAds)} />
        <StatCard
          icon={CheckCircle}
          title="Active ads"
          value={formatNumber(overview.activeAds)}
          helper={`${Math.round((overview.activeAds / Math.max(overview.totalAds, 1)) * 100)}% of inventory`}
        />
        <DeltaCard
          icon={UserPlus}
          title="New users"
          value={formatNumber(overview.newUsers)}
          delta={overview.userGrowth}
        />
        <DeltaCard
          icon={BarChart3}
          title="New ads"
          value={formatNumber(overview.newAds)}
          delta={overview.adGrowth}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base text-white">Recent signups</CardTitle>
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              {recentUsers.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-gray-400">No recent signups.</p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-900/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{user.full_name || "Unnamed"}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>{formatDate(user.created_at)}</div>
                    <div>{formatTime(user.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base text-white">Signup trend</CardTitle>
            <Badge variant="outline" className="border-gray-600 text-gray-300">{rangeLabel}</Badge>
          </CardHeader>
          <CardContent>
            {signupSeries.length === 0 ? (
              <p className="text-sm text-gray-400">No signup activity recorded.</p>
            ) : (
              <div className="flex gap-2">
                {signupSeries.slice(-20).map((point) => (
                  <div key={point.date} className="flex flex-1 flex-col items-center text-xs text-gray-500">
                    <div className="flex h-24 w-full items-end justify-center rounded bg-emerald-900/40">
                      <div
                        className="w-full rounded bg-emerald-400"
                        style={{
                          height: signupMax ? `${Math.max(6, (point.count / signupMax) * 100)}%` : "6%",
                        }}
                        title={`${point.count} on ${point.date}`}
                      />
                    </div>
                    <div className="mt-1 text-white">{point.count}</div>
                    <div>{point.date.slice(5)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base text-white">Pending review</CardTitle>
            <Badge variant="outline" className="border-yellow-600 text-yellow-300">
              {overview.pendingReview}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAds.length === 0 ? (
              <p className="text-sm text-gray-400">No pending ads — great work!</p>
            ) : (
              pendingAds.map((ad) => (
                <div key={ad.id} className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-900/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-white line-clamp-1">{ad.title}</p>
                    <p className="text-xs text-gray-400">{ad.category}</p>
                    <p className="text-xs text-gray-500">{ad.user_email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
                    <span>{formatDate(ad.created_at)}</span>
                    <Button size="sm" variant="outline" onClick={() => onNavigate("pending", ad.id)} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
                      <Eye className="mr-1 h-3 w-3" /> Review
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button size="sm" variant="outline" className="w-full border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white" onClick={() => onNavigate("pending")}>View queue</Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base text-white">Reported content</CardTitle>
            <Badge variant="outline" className="border-red-600 text-red-300">
              {overview.reportedAds}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportedItems.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing reported in this range.</p>
            ) : (
              reportedItems.map((report) => (
                <div key={report.id} className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-900/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-white line-clamp-1">{report.title}</p>
                    <p className="text-xs text-gray-400">{report.reason || "No reason provided"}</p>
                    <p className="text-xs text-gray-500">{report.user_email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
                    <span>{formatDate(report.created_at)}</span>
                    <Button size="sm" variant="outline" onClick={() => onNavigate("reported", report.product_id)} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
                      <Flag className="mr-1 h-3 w-3" /> Resolve
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button size="sm" variant="outline" className="w-full border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white" onClick={() => onNavigate("reported")}>Open reports</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction
          icon={Eye}
          label="Review pending ads"
          description="Triaged listings awaiting moderation"
          count={overview.pendingReview}
          actionLabel="Open queue"
          onClick={() => onNavigate("pending")}
        />
        <QuickAction
          icon={Flag}
          label="Resolve reports"
          description="Content flagged by the community"
          count={overview.reportedAds}
          tone="danger"
          actionLabel="Resolve"
          onClick={() => onNavigate("reported")}
        />
        <QuickAction
          icon={Clock}
          label="Pending verifications"
          description="Check accounts awaiting approval"
          count={recentUsers.length}
          tone="muted"
          actionLabel="Manage users"
          onClick={() => onNavigate("users")}
        />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, helper }: { icon: React.ElementType; title: string; value: string; helper?: string }) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            {helper && <p className="text-xs text-gray-500">{helper}</p>}
          </div>
          <div className="rounded-lg bg-gray-900/60 p-3 text-gray-300">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DeltaCard({
  icon: Icon,
  title,
  value,
  delta,
}: {
  icon: React.ElementType
  title: string
  value: string
  delta: number
}) {
  const positive = delta >= 0
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            <p className={cn("mt-1 flex items-center text-sm", positive ? "text-emerald-400" : "text-red-400")}
            >
              {positive ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
              {positive && "+"}
              {delta}% vs prev period
            </p>
          </div>
          <div className="rounded-lg bg-gray-900/60 p-3 text-gray-300">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickAction({
  icon: Icon,
  label,
  description,
  count,
  actionLabel,
  onClick,
  tone = "neutral",
}: {
  icon: React.ElementType
  label: string
  description: string
  count: number
  actionLabel: string
  onClick: () => void
  tone?: "neutral" | "danger" | "muted"
}) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gray-300" />
            <h3 className="font-semibold text-white">{label}</h3>
          </div>
          <p className="mt-1 text-sm text-gray-400">{description}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
            <Badge
              variant="outline"
              className={cn(
                "border-gray-600 text-gray-200",
                tone === "danger" && "border-red-600 text-red-300",
                tone === "muted" && "border-gray-600 text-gray-400",
              )}
            >
              {formatNumber(count)} open
            </Badge>
            <Button size="sm" variant="link" className="p-0 text-emerald-300" onClick={onClick}>
              {actionLabel}
            </Button>
          </div>
        </div>
        <div className="rounded-full border border-gray-700 bg-gray-900/60 p-3">
          {tone === "danger" ? (
            <AlertTriangle className="h-6 w-6 text-red-400" />
          ) : (
            <Icon className="h-6 w-6 text-gray-300" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
