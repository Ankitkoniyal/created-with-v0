// components/superadmin/pending-review.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Loader2,
  RefreshCw,
  MapPin,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

const getAdShortId = (id: string) => {
  if (!id) return "#——"
  const trimmed = id.replace(/[^a-zA-Z0-9]/g, "")
  return `#${trimmed.slice(-6).toUpperCase()}`
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value ?? 0)

interface PendingAd {
  id: string
  title: string
  description: string
  price: number
  category: string
  created_at: string
  user_id: string
  user_email: string
  images: string[]
  location?: string | null
  serialNumber?: number
}

const PAGE_SIZE = 20

const logAdminAction = async (action: string, entityId: string, payload?: Record<string, unknown>) => {
  try {
    await fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, entityType: "pending_ad", entityId, payload }),
    })
  } catch (error) {
    console.warn("Audit log failed", error)
  }
}

const matchesFilters = (ad: PendingAd, term: string) => {
  const query = term.trim().toLowerCase()
  if (!query) return true
  const haystack = [
    ad.title,
    ad.description,
    ad.category,
    ad.user_email,
    ad.id,
  ]
  return haystack.some((value) => value.toLowerCase().includes(query))
}

type ProductStatus = "active" | "rejected"

const updateProductStatusViaApi = async (payload: { adId: string; status: ProductStatus; note?: string | null }) => {
  const response = await fetch("/api/admin/products/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message.error || "Status update failed")
  }
}

export function PendingReview() {
  const supabase = createClient()
  const { user: currentUser, isAdmin } = useAuth()
  const router = useRouter()

  const [ads, setAds] = useState<PendingAd[]>([])
  const [loading, setLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [moderationDialog, setModerationDialog] = useState<{
    open: boolean
    ad: PendingAd | null
    decision: "approve" | "reject"
  }>({ open: false, ad: null, decision: "approve" })
  const [note, setNote] = useState("")

  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.push("/")
    }
  }, [currentUser, isAdmin, router])

  const transformRow = (row: any): PendingAd => ({
    id: row.id,
    title: row.title ?? "Untitled",
    description: row.description ?? "",
    price: row.price ?? 0,
    category: row.category ?? "Uncategorized",
    created_at: row.created_at,
    user_id: row.user_id,
    user_email: row.profiles?.email ?? "Unknown",
    images: row.images ?? [],
    location: row.location ?? null,
  })

  const fetchPendingAds = async ({ reset = false }: { reset?: boolean } = {}) => {
    if (!isAdmin) return
    const from = reset ? 0 : page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    if (reset) {
      setLoading(true)
      setHasMore(true)
      setTotalCount(0)
      setSelectedIds(new Set())
    } else {
      setIsFetchingMore(true)
    }

    try {
      // First, fetch products without relationship query (more reliable)
      const baseQuery = supabase
        .from("products")
        .select(
          `id, title, description, price, category, created_at, user_id, location, images`,
          { count: "exact" },
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .range(from, to)

      const term = searchTerm.trim()
      const query = term
        ? baseQuery.or(
            `title.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%,location.ilike.%${term}%`,
          )
        : baseQuery

      const { data, error, count } = await query
      if (error) {
        console.error("Products query error:", error)
        throw error
      }

      // Fetch user emails separately for better reliability
      const userIds = [...new Set((data || []).map((ad: any) => ad.user_id).filter(Boolean))]
      const userMap = new Map()

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds)

        if (usersError) {
          console.warn("Failed to fetch user emails:", usersError)
          // Continue without user data rather than failing completely
        } else if (usersData) {
          usersData.forEach((user: any) => {
            userMap.set(user.id, user)
          })
        }
      }

      // Transform data with user emails
      const transformed = (data || []).map((row: any) => {
        const user = userMap.get(row.user_id)
        return transformRow({
          ...row,
          profiles: user ? { email: user.email } : null,
        })
      })
      setAds((prev) => (reset ? transformed : [...prev, ...transformed]))
      setTotalCount(count ?? transformed.length + (reset ? 0 : totalCount))
      setHasMore(count ? to + 1 < count : transformed.length === PAGE_SIZE)
      setPage(reset ? 1 : page + 1)
    } catch (err: any) {
      console.error("Error fetching pending ads", {
        error: err,
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack,
      })
      const errorMessage = err?.message || err?.code || err?.details || "Unknown error occurred"
      toast.error(`Failed to load pending ads: ${errorMessage}`)
      if (reset) setAds([])
    } finally {
      setLoading(false)
      setIsFetchingMore(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchPendingAds({ reset: true })
    }
  }, [isAdmin, searchTerm])

  useEffect(() => {
    if (!isAdmin) return
    const channel = supabase
      .channel("super-admin-pending")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: "status=eq.pending" },
        () => fetchPendingAds({ reset: true }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin])

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(new Set(filteredAds.map((ad) => ad.id)))
    } else {
      setSelectedIds(new Set())
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

  const submitDecision = async (ad: PendingAd, decision: "approve" | "reject", moderationNote: string) => {
    setModerationDialog({ open: false, ad: null, decision })
    const previousAds = ads
    setAds((prev) => prev.filter((item) => item.id !== ad.id))

    try {
      const status: ProductStatus = decision === "approve" ? "active" : "rejected"
      const trimmedNote = moderationNote.trim()
      const payload = {
        status,
        moderation_note: trimmedNote || null,
        moderated_at: new Date().toISOString(),
        moderated_by: currentUser?.id ?? null,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from("products").update(payload).eq("id", ad.id)
      if (error) {
        console.warn("Direct Supabase update failed, attempting privileged API", error)
        await updateProductStatusViaApi({ adId: ad.id, status, note: trimmedNote || null })
      }
      const { error: reportError } = await supabase.from("reports").delete().eq("product_id", ad.id)
      if (reportError) {
        console.warn("Failed to prune reports for ad", reportError)
      }
      setTotalCount((prev) => Math.max(prev - 1, 0))
      await logAdminAction(decision === "approve" ? "approve_pending_ad" : "reject_pending_ad", ad.id, payload)
      toast.success(decision === "approve" ? "Ad approved" : "Ad rejected")
    } catch (err) {
      console.error("Failed to update ad", err)
      toast.error("Failed to process ad")
      setAds(previousAds)
    }
  }

  const bulkDecision = async (decision: "approve" | "reject") => {
    if (!selectedIds.size) return
    const ids = Array.from(selectedIds)
    const previous = ads
    setAds((prev) => prev.filter((ad) => !selectedIds.has(ad.id)))
    setSelectedIds(new Set())

    try {
      const status: ProductStatus = decision === "approve" ? "active" : "rejected"
      const payload = {
        status,
        moderated_at: new Date().toISOString(),
        moderated_by: currentUser?.id ?? null,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from("products").update(payload).in("id", ids)
      if (error) {
        console.warn("Bulk Supabase update failed, attempting privileged API fallback", error)
        for (const id of ids) {
          await updateProductStatusViaApi({ adId: id, status })
        }
      }
      await logAdminAction(
        decision === "approve" ? "bulk_approve_pending_ads" : "bulk_reject_pending_ads",
        "bulk",
        { ids },
      )
      toast.success(`Updated ${ids.length} ads`)
      setTotalCount((prev) => Math.max(prev - ids.length, 0))
    } catch (err) {
      toast.error("Bulk action failed")
      setAds(previous)
    }
  }

  const filteredAds = useMemo(() => ads.filter((ad) => matchesFilters(ad, searchTerm)), [ads, searchTerm])

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
          <h1 className="text-3xl font-bold text-white">Pending Review</h1>
          <p className="text-sm text-gray-400">
            Total pending: {totalCount} • Loaded: {ads.length} • Selected: {selectedIds.size}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-gray-600 bg-gradient-to-r from-gray-800 to-gray-700 text-gray-100 hover:from-gray-700 hover:to-gray-600"
            onClick={() => fetchPendingAds({ reset: true })}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          {selectedIds.size > 0 && (
            <div className="flex gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => bulkDecision("approve")}>
                Approve ({selectedIds.size})
              </Button>
              <Button size="sm" variant="destructive" onClick={() => bulkDecision("reject")}>
                Reject ({selectedIds.size})
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search pending ads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-yellow-500" /> Ads Awaiting Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-green-500" /> Loading pending ads...
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No ads are currently pending review.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
                <Checkbox
                  checked={selectedIds.size === filteredAds.length && filteredAds.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-400">Select all {filteredAds.length} ads</span>
              </div>

              {filteredAds.map((ad, index) => {
                const shortId = getAdShortId(ad.id)
                const serialNumber = index + 1
                const primaryImage = ad.images?.[0] ?? null
                const fallbackSrc =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiM0NDQ0NDQiLz48cGF0aCBkPSJNMzIgMzZMMjQgMjhIMzJWMzZMMzIgMjhWMzYiIHN0cm9rZT0iI0JCRkY2RiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+"

                return (
                  <Card
                    key={ad.id}
                    className="bg-gray-700/80 border border-gray-600/60 p-5 rounded-lg hover:border-gray-500 transition-colors"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <div className="flex w-full gap-4">
                          <div className="flex flex-col items-center gap-2 pt-1">
                            <Checkbox
                              checked={selectedIds.has(ad.id)}
                              onCheckedChange={(checked) => toggleSelection(ad.id, checked)}
                              className="mt-0"
                            />
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-600/60 border border-gray-500/50">
                              <span className="text-xs font-bold text-gray-200">{serialNumber}</span>
                            </div>
                          </div>

                          <div className="flex w-full gap-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-gray-600/60 bg-gray-800/60 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {primaryImage ? (
                                <img
                                  src={primaryImage}
                                  alt={ad.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    ;(e.currentTarget as HTMLImageElement).src = fallbackSrc
                                  }}
                                />
                              ) : (
                                <FileText className="w-6 h-6 text-gray-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex flex-wrap items-start gap-2">
                                <h3 className="text-base font-semibold text-white leading-tight flex-1 min-w-0">{ad.title}</h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className="border-blue-500/50 text-blue-300 text-xs font-mono bg-blue-500/10"
                                  >
                                    {shortId}
                                  </Badge>
                                  <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs">
                                    {formatCurrency(ad.price)}
                                  </Badge>
                                </div>
                              </div>

                              <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{ad.description}</p>

                              <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                                <span className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5" /> 
                                  <span className="truncate max-w-[200px]">{ad.user_email}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" /> {ad.category}
                                </span>
                                {ad.location && (
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" /> 
                                    <span className="truncate max-w-[150px]">{ad.location}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" /> 
                                  {new Date(ad.created_at).toLocaleDateString()} {new Date(ad.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start justify-end md:pl-4 flex-shrink-0">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setModerationDialog({ open: true, ad, decision: "approve" })
                                setNote("")
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => {
                                setModerationDialog({ open: true, ad, decision: "reject" })
                                setNote("")
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1.5" />
                              Reject
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="bg-gray-600/60 text-gray-100 hover:bg-gray-500/70 border border-gray-500/60"
                                  aria-label="More actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 bg-gray-800 border border-gray-700 text-gray-100"
                              >
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  className="focus:bg-gray-700 focus:text-white"
                                  onClick={() => window.open(`/product/${ad.id}`, "_blank")}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View listing
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}

              {hasMore && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                    onClick={() => fetchPendingAds()}
                    disabled={isFetchingMore}
                  >
                    {isFetchingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={moderationDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setModerationDialog({ open: false, ad: null, decision: "approve" })
            setNote("")
          }
        }}
      >
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {moderationDialog.decision === "approve" ? "Approve listing" : "Reject listing"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {moderationDialog.decision === "approve"
                ? "The ad will go live immediately."
                : "The ad will be hidden and the owner notified."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md bg-gray-900/60 p-3 text-sm text-gray-200">
              <div className="font-semibold">{moderationDialog.ad?.title}</div>
              <div className="mt-1 text-xs text-gray-400">{moderationDialog.ad?.user_email}</div>
              <div className="mt-2 text-xs text-gray-400 line-clamp-3">
                {moderationDialog.ad?.description}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase text-gray-400">Moderation note</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-2 bg-gray-700 border-gray-600 text-white"
                placeholder="Optional note for audit trail"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setModerationDialog({ open: false, ad: null, decision: "approve" })
                setNote("")
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (moderationDialog.ad) {
                  submitDecision(moderationDialog.ad, moderationDialog.decision, note)
                }
              }}
              className={moderationDialog.decision === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {moderationDialog.decision === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
