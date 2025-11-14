// components/superadmin/reported-ads.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Search,
  Flag,
  User,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Ban,
  Shield,
  RefreshCw,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { PostgrestError } from "@supabase/supabase-js"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface ReportRow {
  id: string
  reason: string | null
  created_at: string
  severity?: string | null
  reporter_user_id: { email: string | null } | null
  product_id: string
  products: {
    id: string
    title: string | null
    description: string | null
    price: number | null
    category: string | null
    created_at: string
    user_id: string
    status: string | null
    profiles: { email: string | null } | null
  } | null
}

interface ReportDetail {
  id: string
  reason: string
  severity: string
  reporter_email: string
  created_at: string
  details?: string | null
}

interface ReportedAd {
  id: string
  title: string
  description: string
  price: number
  category: string
  created_at: string
  user_id: string
  user_email: string
  status: string
  reports: ReportDetail[]
  report_count: number
  highest_severity: string
}

const RECENT_FILTERS_KEY = "superadmin_report_filters"

const logAdminAction = async (action: string, entityId: string, payload?: Record<string, unknown>) => {
  try {
    await fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, entityType: "reported_ad", entityId, payload }),
    })
  } catch (error) {
    console.warn("Audit log failed", error)
  }
}

const severityRank: Record<string, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
}

const matchesFilters = (ad: ReportedAd, search: string, severity: string) => {
  const term = search.trim().toLowerCase()
  const searchMatch =
    !term ||
    ad.title.toLowerCase().includes(term) ||
    ad.description.toLowerCase().includes(term) ||
    ad.category.toLowerCase().includes(term) ||
    ad.user_email.toLowerCase().includes(term) ||
    ad.id.toLowerCase().includes(term)
  const severityMatch = severity === "all" || ad.highest_severity === severity
  return searchMatch && severityMatch
}

export function ReportedAds() {
  const supabase = createClient()
  const { user: currentUser, isAdmin } = useAuth()
  const router = useRouter()

  const [reportedAds, setReportedAds] = useState<ReportedAd[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    ad: ReportedAd | null
    action: "clear" | "reject"
  }>({ open: false, ad: null, action: "clear" })
  const [banDialog, setBanDialog] = useState<{
    open: boolean
    ad: ReportedAd | null
  }>({ open: false, ad: null })
  const [modNote, setModNote] = useState("")
  const [banReason, setBanReason] = useState("")

  const aggregateReportsFromApi = (ads: ReportedAd[]): ReportedAd[] =>
    ads
      .map((ad) => ({
        ...ad,
        highest_severity:
          ad.reports.reduce((acc, report) => (severityRank[report.severity] > severityRank[acc] ? report.severity : acc), "low") ||
          "low",
        report_count: ad.reports.length,
      }))
      .sort((a, b) => b.report_count - a.report_count)

  const fetchReports = async () => {
    if (!isAdmin) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/reports/list")
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Failed to load reports")
      }
      const payload = await response.json()
      if (payload.warning === "reports_table_missing") {
        setReportedAds([])
        setError("Reports table is missing. Create it in Supabase to enable moderation.")
      } else {
        const ads = aggregateReportsFromApi(payload.ads ?? [])
        setReportedAds(ads)
      }
    } catch (err) {
      console.error("Failed to fetch reports", err)
      setError(err instanceof Error ? err.message : "Unexpected error loading reports")
      setReportedAds([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.push("/")
    }
  }, [currentUser, isAdmin, router])

  useEffect(() => {
    fetchReports()
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel("super-admin-reports")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => fetchReports(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin])

  const filteredAds = useMemo(
    () => reportedAds.filter((ad) => matchesFilters(ad, searchTerm, severityFilter)),
    [reportedAds, searchTerm, severityFilter],
  )

  const totalReports = useMemo(() => reportedAds.reduce((acc, ad) => acc + ad.report_count, 0), [reportedAds])

  const clearReports = async (ad: ReportedAd, keepAdActive: boolean) => {
    if (!ad || !currentUser) return
    
    setActionDialog({ open: false, ad: null, action: "clear" })
    const previous = reportedAds
    setReportedAds((prev) => prev.filter((item) => item.id !== ad.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(ad.id)
      return next
    })

    try {
      // Delete reports first
      const { error: deleteError } = await supabase.from("reports").delete().eq("product_id", ad.id)
      if (deleteError) throw deleteError

      if (!keepAdActive) {
        // Use API endpoint for status update (handles notifications)
        // Note: Using 'inactive' instead of 'rejected' as per database constraint
        const response = await fetch("/api/admin/products/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adId: ad.id,
            status: "inactive",
            note: modNote || "Rejected due to reports",
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || "Failed to reject ad")
        }

        await logAdminAction("reject_ad_from_reports", ad.id, { note: modNote })
        toast.success("Ad deactivated and reports cleared successfully")
      } else {
        // Send notification to ad owner that reports were cleared
        try {
          await fetch("/api/admin/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: ad.user_id,
              title: "Reports cleared",
              message: `All reports for your ad "${ad.title}" have been reviewed and cleared. Your ad remains active.`,
              type: "ad_status_change",
              link: `/product/${ad.id}`,
              data: { productId: ad.id, action: "reports_cleared" },
            }),
          }).catch(() => {}) // Silently fail if notification endpoint doesn't exist
        } catch (notifError) {
          console.warn("Failed to send notification", notifError)
        }

        await logAdminAction("clear_reports", ad.id, { note: modNote })
        toast.success("Reports cleared successfully")
      }
    } catch (err) {
      console.error("Failed to resolve reports", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to complete action"
      toast.error(errorMessage)
      setReportedAds(previous)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.add(ad.id)
        return next
      })
    } finally {
      setModNote("")
    }
  }

  const banUser = async (ad: ReportedAd) => {
    if (!ad || !currentUser) return
    
    if (!banReason.trim()) {
      toast.error("Please provide a reason for banning this user")
      return
    }

    const previous = reportedAds
    setBanDialog({ open: false, ad: null })
    setReportedAds((prev) => prev.filter((item) => item.id !== ad.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(ad.id)
      return next
    })

    try {
      // Ban user via API
      const response = await fetch("/api/account/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: ad.user_id, status: "banned", reason: banReason.trim() }),
      })
      
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        const errorMsg = payload.error || "Failed to ban user"
        console.error("Ban user API error:", errorMsg, payload)
        throw new Error(errorMsg)
      }

      // Delete reports
      const { error: reportError } = await supabase.from("reports").delete().eq("product_id", ad.id)
      if (reportError) {
        console.error("Delete reports error:", reportError)
        throw reportError
      }

      // Optionally deactivate user's products when banned (using valid status)
      try {
        const { error: productsError } = await supabase
          .from("products")
          .update({ status: "inactive" })
          .eq("user_id", ad.user_id)
          .neq("status", "sold") // Don't change sold items
        
        if (productsError && productsError.code !== "23514") {
          // Only log if it's not the constraint error (which we're handling)
          console.warn("Failed to update user products:", productsError)
        }
      } catch (productsUpdateError) {
        // Silently continue - product update is optional
        console.warn("Product update skipped:", productsUpdateError)
      }

      // Send notification to banned user
      try {
        await fetch("/api/admin/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: ad.user_id,
            title: "Account banned",
            message: `Your account has been banned. Reason: ${banReason.trim()}. Your ad "${ad.title}" has been removed.`,
            type: "account_status_change",
            priority: "critical",
            data: { reason: banReason.trim(), adId: ad.id },
          }),
        }).catch(() => {}) // Silently fail if notification endpoint doesn't exist
      } catch (notifError) {
        console.warn("Failed to send notification", notifError)
      }

      await logAdminAction("ban_user_from_reports", ad.user_id, { adId: ad.id, reason: banReason })
      toast.success("User banned and reports cleared successfully")
    } catch (err) {
      console.error("Failed to ban user", err)
      const errorMessage = err instanceof Error ? err.message : "Unable to ban user"
      toast.error(errorMessage)
      setReportedAds(previous)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.add(ad.id)
        return next
      })
    } finally {
      setBanReason("")
    }
  }

  const toggleSelection = (adId: string, checked: boolean | "indeterminate") => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked === true) {
        next.add(adId)
      } else {
        next.delete(adId)
      }
      return next
    })
  }

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(new Set(filteredAds.map((ad) => ad.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const bulkClear = async () => {
    if (!selectedIds.size) return
    const ids = Array.from(selectedIds)
    const before = reportedAds
    setReportedAds((prev) => prev.filter((ad) => !selectedIds.has(ad.id)))
    setSelectedIds(new Set())

    try {
      const { error } = await supabase.from("reports").delete().in("product_id", ids)
      if (error) throw error
      await logAdminAction("bulk_clear_reports", "bulk", { ids })
      toast.success(`Cleared reports for ${ids.length} ads`)
    } catch (err) {
      console.error("Failed to clear reports", err)
      toast.error("Failed to clear reports")
      setReportedAds(before)
      setSelectedIds(new Set(ids))
    }
  }

  const severityBadge = (severity: string) => {
    const map: Record<string, string> = {
      critical: "bg-red-600",
      high: "bg-red-500",
      medium: "bg-yellow-500",
      low: "bg-green-600",
    }
    return <Badge className={map[severity] ?? "bg-gray-500"}>{severity.toUpperCase()}</Badge>
  }

  if (currentUser && !isAdmin) {
    return (
      <Card className="p-6 bg-gray-800 border-gray-700 text-white">
        <p>You do not have permission to view this page.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reported Ads</h1>
          <p className="text-sm text-gray-400">
            Total reports: {totalReports} • Showing: {filteredAds.length} • Selected: {selectedIds.size}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
            onClick={() => fetchReports()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          {selectedIds.size > 0 && (
            <Button 
              onClick={bulkClear} 
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Clear Reports ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-900 border-red-700 text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-300" />
          <p className="text-sm">{error}</p>
        </Card>
      )}

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title, user, category, or ad ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <SelectSeverity value={severityFilter} onChange={setSeverityFilter} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Flag className="w-5 h-5 text-red-500" /> Reported Ads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-green-500" />
              Loading reported ads...
            </div>
          ) : filteredAds.length === 0 && !loading && !error ? (
            <div className="py-8 text-center text-gray-500">No reported ads match the current filters.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
                <Checkbox
                  checked={selectedIds.size === filteredAds.length && filteredAds.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-400">Select all {filteredAds.length} ads</span>
              </div>

              {filteredAds.map((ad) => (
                <Card key={ad.id} className="bg-gray-700 border-gray-600 p-4 space-y-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-3 flex-1">
                      <Checkbox
                        checked={selectedIds.has(ad.id)}
                        onCheckedChange={(checked) => toggleSelection(ad.id, checked)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        {/* Ad Header */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{ad.title}</h3>
                            <Badge className="bg-emerald-600 text-white font-medium">
                              ${ad.price}
                            </Badge>
                            {severityBadge(ad.highest_severity)}
                            <Badge className="bg-orange-600 text-white">
                              {ad.report_count} {ad.report_count === 1 ? "report" : "reports"}
                            </Badge>
                            <Badge variant="outline" className="border-gray-500 text-gray-300">
                              {ad.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2">{ad.description}</p>
                        </div>

                        {/* Ad Owner Section - Clear Label */}
                        <div className="rounded-lg bg-gray-800/60 border border-gray-600 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-semibold uppercase text-gray-400 tracking-wide">Ad Owner</span>
                          </div>
                          <div className="text-sm text-white font-medium">{ad.user_email}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {ad.category}
                            </span>
                            <span>Created: {new Date(ad.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Reporters Section - Clear Label */}
                        <div className="rounded-lg bg-red-950/30 border border-red-800/50 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Flag className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-semibold uppercase text-red-300 tracking-wide">
                              Reported By ({ad.reports.length} {ad.reports.length === 1 ? "person" : "people"})
                            </span>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {ad.reports.map((report) => (
                              <div key={report.id} className="rounded bg-gray-800/80 p-2 text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-red-300 font-medium">{report.reporter_email}</span>
                                  <span className="text-gray-500">{new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-200 text-xs mb-1">{report.reason}</p>
                                <Badge className={`text-xs ${
                                  report.severity === "critical" ? "bg-red-700" :
                                  report.severity === "high" ? "bg-red-600" :
                                  report.severity === "medium" ? "bg-yellow-600" :
                                  "bg-green-600"
                                }`}>
                                  {report.severity}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Consistent Styling */}
                    <div className="flex flex-wrap gap-2 lg:flex-col lg:min-w-[140px]">
                      <Button
                        size="sm"
                        onClick={() => {
                          setActionDialog({ open: true, ad, action: "clear" })
                          setModNote("")
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Keep & Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setActionDialog({ open: true, ad, action: "reject" })
                          setModNote("")
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white w-full"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Deactivate Ad
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setBanDialog({ open: true, ad })}
                        className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                      >
                        <Ban className="w-4 h-4 mr-1" /> Ban User
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/product/${ad.id}`, "_blank")}
                        className="border-gray-500 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white w-full"
                      >
                        View Listing
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ActionDialog
        state={actionDialog}
        onClose={() => {
          setActionDialog({ open: false, ad: null, action: "clear" })
          setModNote("")
        }}
        modNote={modNote}
        setModNote={setModNote}
        onConfirm={(keep) => {
          if (actionDialog.ad) clearReports(actionDialog.ad, keep)
        }}
      />

      <BanDialog
        state={banDialog}
        onClose={() => {
          setBanDialog({ open: false, ad: null })
          setBanReason("")
        }}
        banReason={banReason}
        setBanReason={setBanReason}
        onConfirm={() => {
          if (banDialog.ad) banUser(banDialog.ad)
        }}
      />
    </div>
  )
}

interface SelectSeverityProps {
  value: string
  onChange: (value: string) => void
}

function SelectSeverity({ value, onChange }: SelectSeverityProps) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs uppercase text-gray-400">Severity</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white shadow-sm focus:border-green-500 focus:outline-none"
      >
        <option value="all">All</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  )
}

interface ActionDialogProps {
  state: { open: boolean; ad: ReportedAd | null; action: "clear" | "reject" }
  onClose: () => void
  modNote: string
  setModNote: (value: string) => void
  onConfirm: (keepActive: boolean) => void
}

function ActionDialog({ state, onClose, modNote, setModNote, onConfirm }: ActionDialogProps) {
  const keepActive = state.action === "clear"
  const title = keepActive ? "Keep Ad & Clear Reports" : "Deactivate Ad"
  const description = keepActive
    ? "Confirm to keep the ad active and clear all associated reports."
    : "This will deactivate the ad (set status to inactive) and remove all reports. The ad owner will be notified."

  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-gray-400">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase text-gray-400">Moderation note</Label>
            <Textarea
              value={modNote}
              onChange={(e) => setModNote(e.target.value)}
              rows={3}
              placeholder="Provide context for this decision (visible to admins)"
              className="mt-2 bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(keepActive)}
            className={`text-white ${keepActive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {keepActive ? "Keep ad & clear reports" : "Deactivate ad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface BanDialogProps {
  state: { open: boolean; ad: ReportedAd | null }
  onClose: () => void
  banReason: string
  setBanReason: (value: string) => void
  onConfirm: () => void
}

function BanDialog({ state, onClose, banReason, setBanReason, onConfirm }: BanDialogProps) {
  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Ban user?</DialogTitle>
          <DialogDescription className="text-gray-400">
            This will deactivate the user account and remove all associated reports for this listing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md bg-red-900/40 p-3 text-sm text-red-200">
            <Shield className="h-4 w-4" /> This action cannot be undone. Provide a clear reason for the ban.
          </div>
          <div>
            <Label className="text-xs uppercase text-gray-400">Reason</Label>
            <Textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
              className="mt-2 bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
            Ban user & clear reports
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
