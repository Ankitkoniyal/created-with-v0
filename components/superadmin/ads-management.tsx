"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  FileText,
  Calendar,
  MapPin,
  Tag,
  Eye,
  Download,
  RefreshCw,
  Trash2,
  Loader2,
  User,
  MoreVertical,
  CheckCircle,
  Clock,
  Ban,
  XCircle,
  Package
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  location?: string | null
  status: 'active' | 'sold' | 'expired' | 'pending' | 'rejected' | 'deleted' | 'inactive'
  views: number
  clicks?: number | null
  created_at: string
  updated_at: string
  user_id: string
  images: string[] | null
  is_featured?: boolean
  moderation_note?: string | null
  moderated_by?: string | null
  moderated_at?: string | null
  user?: {
    email: string
    full_name?: string | null
  }
}

type SupabaseProductRow = {
  id: string
  title: string | null
  description: string | null
  price: number | null
  category: string | null
  location: string | null
  status: Product['status'] | null
  views: number | null
  clicks?: number | null
  created_at: string
  updated_at: string
  user_id: string
  images: string[] | null
  is_featured?: boolean | null
  moderation_note?: string | null
  moderated_by?: string | null
  moderated_at?: string | null
  profiles?: {
    email: string
    full_name?: string | null
  } | null
}

const transformProduct = (ad: SupabaseProductRow): Product => ({
  id: ad.id,
  title: ad.title || "Untitled",
  description: ad.description || "",
  price: ad.price ?? 0,
  category: ad.category || "Uncategorized",
  location: ad.location,
  status: (ad.status as Product['status']) || "pending",
  views: ad.views ?? 0,
  clicks: ad.clicks ?? null,
  created_at: ad.created_at,
  updated_at: ad.updated_at,
  user_id: ad.user_id,
  images: ad.images || [],
  is_featured: !!ad.is_featured,
  moderation_note: ad.moderation_note || null,
  moderated_by: ad.moderated_by || null,
  moderated_at: ad.moderated_at || null,
  user: ad.profiles
    ? {
        email: ad.profiles.email,
        full_name: ad.profiles.full_name,
      }
    : { email: "Unknown" },
})

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

const EXPORT_FORMATS = [
  { type: "csv", label: "CSV (Comma separated)", extension: "csv", mime: "text/csv", delimiter: "," },
  {
    type: "tsv",
    label: "Excel TSV (.xls)",
    extension: "xls",
    mime: "application/vnd.ms-excel",
    delimiter: "\t",
  },
  { type: "json", label: "JSON", extension: "json", mime: "application/json" },
] as const

const matchesFilters = (ad: Product, statusFilter: string, searchQuery: string) => {
  if (statusFilter !== "all" && ad.status !== statusFilter) return false
  const term = searchQuery.trim().toLowerCase()
  if (!term) return true
  const haystack = [
    ad.title,
    ad.description,
    ad.category,
    ad.location ?? "",
    ad.user?.email ?? "",
    ad.id,
  ]
  return haystack.some((entry) => entry.toLowerCase().includes(term))
}

const logAdminAction = async (action: string, entityId: string, payload?: Record<string, unknown>) => {
  try {
    await fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, entityType: "product", entityId, payload }),
    })
  } catch (error) {
    console.warn("Audit log failed", error)
  }
}

const updateProductStatusViaApi = async (payload: { adId: string; status: Product["status"]; note?: string }) => {
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

const deleteProductsViaApi = async (adIds: string[], reason?: string) => {
  const response = await fetch("/api/admin/products/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adIds, reason }),
  })

  if (!response.ok) {
    const message = await response.json().catch(() => ({}))
    throw new Error(message.error || "Failed to delete ads")
  }
}

export default function AdsManagement() {
  const PAGE_SIZE = 20

  const [ads, setAds] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAd, setSelectedAd] = useState<Product | null>(null)
  const [adDetailsOpen, setAdDetailsOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<Product | null>(null)
  const [statusChangeDialog, setStatusChangeDialog] = useState<{ ad: Product; newStatus: Product['status']; note?: string } | null>(null)
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [moderationNote, setModerationNote] = useState("")
  const [editDialog, setEditDialog] = useState<{ open: boolean; ad: Product | null }>({ open: false, ad: null })
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    category: "",
    location: "",
    description: "",
    status: "pending" as Product['status'],
    is_featured: false,
    moderation_note: "",
  })

  useEffect(() => {
    if (statusChangeDialog) {
      setModerationNote(statusChangeDialog.ad.moderation_note ?? "")
    } else {
      setModerationNote("")
    }
  }, [statusChangeDialog])

  const { isAdmin, user: currentUser } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Redirect non-admins
  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.push("/")
    }
  }, [currentUser, isAdmin, router])

  const fetchAds = async ({ reset = false }: { reset?: boolean } = {}) => {
    const nextPage = reset ? 0 : page
    const from = nextPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    if (reset) {
      setLoading(true)
      setHasMore(true)
      setTotalCount(0)
      setSelectedAds(new Set<string>())
    } else {
      setIsFetchingMore(true)
    }

    try {
      // Fetch products without relationship query (more reliable)
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const term = searchQuery.trim()
      if (term) {
        const like = `%${term}%`
        query = query.or(`title.ilike.${like},description.ilike.${like},category.ilike.${like},location.ilike.${like}`)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('❌ Error fetching ads:', {
          error,
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        })
        toast.error(`Failed to load ads: ${error?.message || error?.code || 'Unknown error'}`)
        if (reset) setAds([])
        return
      }

      // Fetch user emails separately for better reliability
      const userIds = [...new Set((data || []).map((ad: any) => ad.user_id).filter(Boolean))]
      const userMap = new Map()

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds)

        if (usersError) {
          console.warn('Failed to fetch user data:', usersError)
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
        return transformProduct({
          ...row,
          profiles: user ? { email: user.email, full_name: user.full_name } : null,
        } as SupabaseProductRow)
      })

      setAds((prev) => {
        if (reset) return transformed
        const existingIds = new Set(prev.map((item) => item.id))
        const merged = [...prev]
        transformed.forEach((item) => {
          if (!existingIds.has(item.id)) {
            merged.push(item)
          }
        })
        return merged
      })

      setTotalCount(count ?? 0)
      const received = from + transformed.length
      setHasMore(count ? received < count : transformed.length === PAGE_SIZE)
      setPage(reset ? 1 : nextPage + 1)
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      toast.error('Failed to load ads')
      if (reset) setAds([])
    } finally {
      setLoading(false)
      setIsFetchingMore(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchAds({ reset: true })
    } else if (isAdmin === false) {
      setLoading(false)
    }
  }, [isAdmin, statusFilter, searchQuery])

  // Realtime subscription for products table
  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel("super-admin-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as SupabaseProductRow).id
            setAds((prev) => prev.filter((ad) => ad.id !== deletedId))
            setTotalCount((prev) => Math.max(prev - 1, 0))
            return
          }

          const record = payload.new as SupabaseProductRow
          const transformed = transformProduct(record)

          setAds((prev) => {
            const exists = prev.findIndex((ad) => ad.id === transformed.id)
            if (!matchesFilters(transformed, statusFilter, searchQuery)) {
              if (exists !== -1) {
                const next = [...prev]
                next.splice(exists, 1)
                return next
              }
              return prev
            }

            if (exists === -1) {
              if (payload.eventType === 'INSERT') {
                setTotalCount((prevCount) => prevCount + 1)
              }
              return [transformed, ...prev]
            }

            const next = [...prev]
            next[exists] = { ...next[exists], ...transformed }
            return next
          })

          if (payload.eventType === 'UPDATE') {
            const previousRecord = payload.old as SupabaseProductRow
            if (previousRecord) {
              const previousProduct = transformProduct(previousRecord)
              const prevMatches = matchesFilters(previousProduct, statusFilter, searchQuery)
              const nextMatches = matchesFilters(transformed, statusFilter, searchQuery)
              if (prevMatches && !nextMatches) {
                setTotalCount((prev) => Math.max(prev - 1, 0))
              }
              if (!prevMatches && nextMatches) {
                setTotalCount((prev) => prev + 1)
              }
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin, supabase, statusFilter, searchQuery])

  // Handle status change
  const handleStatusChange = async (ad: Product, newStatus: Product['status'], note?: string) => {
    const adId = ad.id
    setActionLoading(adId)

    const previousAds = ads
    const moderatedAt = new Date().toISOString()
    const previousMatches = matchesFilters(ad, statusFilter, searchQuery)
    const projectedAd: Product = {
      ...ad,
      status: newStatus,
      moderation_note: note ?? ad.moderation_note ?? null,
      moderated_at: moderatedAt,
      moderated_by: currentUser?.id ?? ad.moderated_by ?? null,
      updated_at: moderatedAt,
    }
    const willRemain = matchesFilters(projectedAd, statusFilter, searchQuery)
    let countDelta = 0
    if (previousMatches && !willRemain) {
      countDelta = -1
      setTotalCount((prev) => Math.max(prev - 1, 0))
    } else if (!previousMatches && willRemain) {
      countDelta = 1
      setTotalCount((prev) => prev + 1)
    }

    setAds((prev) =>
      prev
        .map((item) =>
          item.id === adId
            ? {
                ...item,
                status: newStatus,
                moderation_note: note ?? item.moderation_note ?? null,
                moderated_by: currentUser?.id ?? item.moderated_by ?? null,
                moderated_at: moderatedAt,
                updated_at: moderatedAt,
              }
            : item,
        )
        .filter((item) => matchesFilters(item, statusFilter, searchQuery)),
    )

    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: newStatus,
          moderation_note: note ?? null,
          moderated_by: currentUser?.id ?? null,
          moderated_at: moderatedAt,
          updated_at: moderatedAt,
        })
        .eq('id', adId)

      if (error) {
        console.warn('Supabase client update failed, attempting privileged API', error)
        await updateProductStatusViaApi({ adId, status: newStatus, note })
      }

      toast.success(`Ad status updated to ${newStatus}`)
      await logAdminAction('update_product_status', adId, { newStatus, note })
      setStatusChangeDialog(null)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
      setAds(previousAds)
      if (countDelta !== 0) {
        setTotalCount((prev) => prev - countDelta)
      }
    } finally {
      setActionLoading(null)
    }
  }

  // Handle delete
  const handleDeleteAd = async (adId: string) => {
    setActionLoading(adId)
    const previousAds = ads
    try {
      setAds((prev) => prev.filter((ad) => ad.id !== adId))
      setTotalCount((prev) => Math.max(prev - 1, 0))

      try {
        await deleteProductsViaApi([adId])
      } catch (apiError) {
        console.warn("Primary delete attempt failed, falling back to direct Supabase delete.", apiError)
        const { error } = await supabase.from("products").delete().eq("id", adId)
        if (error) throw error
      }

      setSelectedAds((prev: Set<string>) => {
        const newSet = new Set(prev)
        newSet.delete(adId)
        return newSet
      })

      toast.success("Ad deleted successfully")
      await logAdminAction('delete_product', adId)
      setDeleteDialog(null)
    } catch (error) {
      console.error("Error deleting ad:", error)
      toast.error("Failed to delete ad")
      setAds(previousAds)
    } finally {
      setActionLoading(null)
    }
  }

  // View ad details
  const handleViewAdDetails = (ad: Product) => {
    setSelectedAd(ad)
    setAdDetailsOpen(true)
  }

  // View ad on site
  const handleViewAdOnSite = (adId: string) => {
    window.open(`/product/${adId}`, '_blank')
  }

  // Selection handlers
  const handleSelectAd = (adId: string, checked: boolean | "indeterminate") => {
    setSelectedAds((prev: Set<string>) => {
      const newSet = new Set(prev)
      if (checked === true) {
        newSet.add(adId)
      } else {
        newSet.delete(adId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedAds(new Set<string>(filteredAds.map(ad => ad.id)))
    } else {
      setSelectedAds(new Set<string>())
    }
  }

  // Bulk actions
  const handleBulkStatusChange = async (newStatus: Product['status']) => {
    if (selectedAds.size === 0) return
    
    setActionLoading('bulk')
    const previousAds = ads
    const moderatedAt = new Date().toISOString()
    setAds((prev) =>
      prev.map((ad) =>
        selectedAds.has(ad.id)
          ? {
              ...ad,
              status: newStatus,
              moderated_by: currentUser?.id ?? ad.moderated_by ?? null,
              moderated_at: moderatedAt,
              updated_at: moderatedAt,
            }
          : ad,
      ),
    )
    try {
      const adIds = Array.from(selectedAds)
      for (const adId of adIds) {
        try {
          await updateProductStatusViaApi({ adId, status: newStatus })
        } catch (error) {
          console.warn(`Bulk status update failed for ${adId}`, error)
          throw error
        }
      }

      // Update local state
      setAds(prev => prev.map(ad => 
        selectedAds.has(ad.id) ? { ...ad, status: newStatus } : ad
      ))

      toast.success(`Updated ${selectedAds.size} ads`)
      await logAdminAction('bulk_update_product_status', 'bulk', { ids: adIds, newStatus })
      setSelectedAds(new Set<string>())
    } catch (error) {
      console.error("Error in bulk update:", error)
      toast.error("Failed to update ads")
      setAds(previousAds)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkDelete = async () => {
     if (selectedAds.size === 0) return
     
     setActionLoading('bulk-delete')
     const previousAds = ads
     setAds((prev) => prev.filter((ad) => !selectedAds.has(ad.id)))
     try {
       const adIds = Array.from(selectedAds)
      try {
        await deleteProductsViaApi(adIds)
      } catch (apiError) {
        console.warn("Bulk delete via API failed, attempting direct Supabase delete.", apiError)
        const { error } = await supabase.from("products").delete().in("id", adIds)
        if (error) throw error
      }
 
       setTotalCount((prev) => Math.max(prev - adIds.length, 0))
       toast.success(`Deleted ${adIds.length} ads`)
       await logAdminAction('bulk_delete_products', 'bulk', { ids: adIds })
       setSelectedAds(new Set<string>())
     } catch (error) {
       console.error("Error in bulk delete:", error)
       toast.error("Failed to delete ads")
       setAds(previousAds)
     } finally {
       setActionLoading(null)
     }
   }

  const handleToggleFeatured = async (ad: Product, desired?: boolean) => {
    const adId = ad.id
    setActionLoading(adId)
    const previousAds = ads

    setAds((prev) =>
      prev
        .map((item) =>
          item.id === adId
            ? { ...item, is_featured: desired ?? !ad.is_featured, updated_at: new Date().toISOString() }
          : item,
        )
        .filter((item) => matchesFilters(item, statusFilter, searchQuery)),
    )

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: desired ?? !ad.is_featured, updated_at: new Date().toISOString() })
        .eq('id', adId)

      if (error) throw error

      toast.success(ad.is_featured ? 'Ad removed from featured list' : 'Ad featured successfully')
      await logAdminAction(ad.is_featured ? 'feature_product' : 'unfeature_product', adId)
    } catch (error) {
      console.error('Error toggling feature status:', error)
      toast.error('Failed to update featured status')
      setAds(previousAds)
    } finally {
      setActionLoading(null)
    }
  }

  const openEditDialog = (ad: Product) => {
    setEditDialog({ open: true, ad })
    setEditForm({
      title: ad.title,
      price: String(ad.price ?? ""),
      category: ad.category,
      location: ad.location ?? "",
      description: ad.description,
      status: ad.status,
      is_featured: !!ad.is_featured,
      moderation_note: ad.moderation_note ?? "",
    })
  }

  const handleEditFieldChange = (field: keyof typeof editForm, value: string | boolean) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = async () => {
    if (!editDialog.ad) return
    const adId = editDialog.ad.id
    setActionLoading(`${adId}-edit`)
    const previousAds = ads

    const updated_at = new Date().toISOString()
    const payload = {
      title: editForm.title.trim() || editDialog.ad.title,
      price: Number(editForm.price) || 0,
      category: editForm.category.trim() || editDialog.ad.category,
      location: editForm.location.trim() || null,
      description: editForm.description.trim(),
      status: editForm.status,
      is_featured: editForm.is_featured,
      moderation_note: editForm.moderation_note.trim() || null,
      updated_at,
    }

    const previousMatches = matchesFilters(editDialog.ad, statusFilter, searchQuery)
    const projectedAd: Product = {
      ...editDialog.ad,
      ...payload,
    }
    const willRemain = matchesFilters(projectedAd, statusFilter, searchQuery)
    let countDelta = 0
    if (previousMatches && !willRemain) {
      countDelta = -1
      setTotalCount((prev) => Math.max(prev - 1, 0))
    } else if (!previousMatches && willRemain) {
      countDelta = 1
      setTotalCount((prev) => prev + 1)
    }

    setAds((prev) =>
      prev
        .map((item) =>
          item.id === adId
            ? {
                ...item,
                ...payload,
                moderation_note: payload.moderation_note,
              }
            : item,
        )
        .filter((item) => matchesFilters(item, statusFilter, searchQuery)),
    )

    try {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', adId)

      if (error) throw error

      toast.success('Ad updated successfully')
      await logAdminAction('edit_product', adId, payload)
      setEditDialog({ open: false, ad: null })
    } catch (error) {
      console.error('Error updating ad', error)
      toast.error('Failed to update ad')
      setAds(previousAds)
      if (countDelta !== 0) {
        setTotalCount((prev) => prev - countDelta)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const exportAds = (format: (typeof EXPORT_FORMATS)[number]["type"], dataset = filteredAds) => {
    if (!dataset.length) {
      toast.error("Nothing to export")
      return
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
    const selectedFormat = EXPORT_FORMATS.find((item) => item.type === format) ?? EXPORT_FORMATS[0]

    if (format === "json") {
      const payload = JSON.stringify(
        dataset.map((ad) => ({
          id: ad.id,
          shortId: getAdShortId(ad.id),
          title: ad.title,
          price: ad.price,
          category: ad.category,
          location: ad.location,
          status: ad.status,
          views: ad.views,
          userEmail: ad.user?.email ?? "Unknown",
          createdAt: ad.created_at,
          updatedAt: ad.updated_at,
        })),
        null,
        2,
      )
      const blob = new Blob([payload], { type: selectedFormat.mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ads-export-${timestamp}.${selectedFormat.extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Exported ads as JSON")
      return
    }

    const headers = ["ID", "Short ID", "Title", "Price", "Category", "Location", "Status", "Views", "User Email", "Created At"]
    const rows = dataset.map((ad) => [
      ad.id,
      getAdShortId(ad.id),
      ad.title.replace(/"/g, '""'),
      ad.price,
      ad.category,
      ad.location ?? "",
      ad.status,
      ad.views,
      ad.user?.email ?? "Unknown",
      new Date(ad.created_at).toLocaleString(),
    ])

    const delimiter = "delimiter" in selectedFormat ? selectedFormat.delimiter : ","
    const serialized = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            if (typeof cell === "number") return cell
            const value = `${cell ?? ""}`
            return delimiter === "," ? `"${value.replace(/"/g, '""')}"` : value
          })
          .join(delimiter),
      )
      .join("\n")

    const blob = new Blob([serialized], { type: selectedFormat.mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ads-export-${timestamp}.${selectedFormat.extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`Exported ads as ${selectedFormat.label}`)
  }

  const filteredAds = ads

  // Status badge helper
  const getStatusBadge = (status: Product['status']) => {
    const statusConfig = {
      active: { class: "bg-green-600", label: "Active" },
      pending: { class: "bg-yellow-600", label: "Pending" },
      rejected: { class: "bg-red-600", label: "Rejected" },
      sold: { class: "bg-blue-600", label: "Sold" },
      expired: { class: "bg-gray-600", label: "Expired" },
      inactive: { class: "bg-orange-600", label: "Inactive" },
      deleted: { class: "bg-red-800", label: "Deleted" }
    }
    
    const config = statusConfig[status] || { class: "bg-gray-600", label: status }
    return <Badge className={config.class}>{config.label}</Badge>
  }

  // Status options for dropdown
  const getStatusOptions = (currentStatus: Product['status']) => {
    const allStatuses: Product['status'][] = ['active', 'pending', 'inactive', 'rejected', 'sold', 'expired']
    return allStatuses.filter(status => status !== currentStatus)
  }

  // Status icons
  const getStatusIcon = (status: Product['status']) => {
    const icons = {
      active: CheckCircle,
      pending: Clock,
      inactive: Ban,
      rejected: XCircle,
      sold: Package,
      expired: Ban,
      deleted: Trash2,
    }
    const IconComponent = icons[status]
    return IconComponent ? <IconComponent className="w-4 h-4 mr-2" /> : null
  }

  // Don't render for non-admins
  if (currentUser && !isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Ads Management</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400">You don't have access to this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Ads Management</h1>
          <p className="text-gray-400 text-sm">
            Total in database: {totalCount} • Loaded: {ads.length} • Selected: {selectedAds.size}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-gray-600 bg-gradient-to-r from-gray-800 to-gray-700 text-gray-100 hover:from-gray-700 hover:to-gray-600"
                disabled={filteredAds.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-700 text-gray-100">
              <DropdownMenuLabel className="text-xs uppercase text-gray-400">Choose format</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              {EXPORT_FORMATS.map((option) => (
                <DropdownMenuItem
                  key={option.type}
                  className="focus:bg-gray-700 focus:text-white"
                  onClick={() => exportAds(option.type)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => fetchAds({ reset: true })}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedAds.size > 0 && (
        <Card className="bg-blue-900 border-blue-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600">{selectedAds.size} selected</Badge>
                <span className="text-white">Bulk actions:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Mark as Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange('pending')}>
                      <Clock className="w-4 h-4 mr-2" /> Mark as Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange('inactive')}>
                      <Ban className="w-4 h-4 mr-2" /> Mark as Inactive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusChange('rejected')}>
                      <XCircle className="w-4 h-4 mr-2" /> Mark as Rejected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={handleBulkDelete}
                  disabled={actionLoading === 'bulk-delete'}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> 
                  Delete Selected
                </Button>

                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedAds(new Set<string>())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ads List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" /> 
            Ads List ({filteredAds.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500" />
              <p className="text-gray-400 mt-2">Loading ads...</p>
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No ads found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
              <Button 
                onClick={() => { setSearchQuery(""); setStatusFilter("all") }} 
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center gap-3 p-2 border-b border-gray-700">
                <Checkbox 
                  checked={selectedAds.size === filteredAds.length && filteredAds.length > 0} 
                  onCheckedChange={handleSelectAll} 
                />
                <span className="text-sm text-gray-400">
                  Select all {filteredAds.length} ads
                </span>
              </div>

              {/* Ads List */}
              {filteredAds.map((ad) => {
                const shortId = getAdShortId(ad.id)
                return (
                <div
                  key={ad.id}
                  className="flex items-start gap-3 p-4 bg-gray-700/80 rounded-xl border border-gray-600/40 backdrop-blur-sm transition-colors hover:bg-gray-600/80"
                >
                  <Checkbox
                    checked={selectedAds.has(ad.id)}
                    onCheckedChange={(checked) => handleSelectAd(ad.id, checked)}
                  />

                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Ad Image */}
                      <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {ad.images && ad.images.length > 0 ? (
                          <img
                            src={ad.images[0]}
                            alt={ad.title}
                            className="w-16 h-16 rounded-lg object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMzNzQxNTEiLz48cGF0aCBkPSJNMzIgMzZMMjQgMjhIMzJWMzZMMzIgMjhWMzYiIHN0cm9rZT0iIzhFOTNBQiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+"
                            }}
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      {/* Ad Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white text-lg truncate">{ad.title}</h3>
                          <Badge variant="outline" className="border-gray-500/70 text-xs font-mono text-gray-200">
                            {shortId}
                          </Badge>
                          {getStatusBadge(ad.status)}
                          <Badge variant="outline" className="text-emerald-300 border-emerald-500 bg-emerald-500/10">
                            {formatCurrency(ad.price)}
                          </Badge>
                          {ad.is_featured && <Badge className="bg-yellow-500 text-black">Featured</Badge>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center gap-1 text-gray-300">
                            <User className="w-3 h-3" />
                            <span className="truncate">{ad.user?.email || "Unknown User"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-300">
                            <Tag className="w-3 h-3" />
                            <span>{ad.category}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-300">
                            <MapPin className="w-3 h-3" />
                            <span>{ad.location || "No location"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-300">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">{ad.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewAdOnSite(ad.id)}
                      className="border-gray-600 text-emerald-300 bg-transparent hover:bg-emerald-900/30 hover:text-emerald-100"
                      title="View on site"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent border-gray-600 text-gray-200 hover:bg-gray-600/60"
                          disabled={actionLoading === ad.id}
                        >
                          {actionLoading === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 w-64 text-gray-100">
                        <DropdownMenuLabel className="text-white">Admin Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />

                        <DropdownMenuItem
                          onClick={() => openEditDialog(ad)}
                          className="text-emerald-300 hover:bg-emerald-900 hover:text-emerald-200 cursor-pointer"
                        >
                          <Package className="w-4 h-4 mr-2" /> Edit Details
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-gray-700" />

                        <DropdownMenuItem
                          onClick={() => handleViewAdDetails(ad)}
                          className="text-blue-400 hover:bg-blue-900 hover:text-blue-300 cursor-pointer"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Full Details
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuLabel className="text-gray-400 text-xs">Change Status</DropdownMenuLabel>

                        {getStatusOptions(ad.status).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => {
                              setStatusChangeDialog({ ad, newStatus: status })
                              setModerationNote(ad.moderation_note ?? "")
                            }}
                            className="text-emerald-300 hover:bg-emerald-900 hover:text-emerald-200 cursor-pointer"
                          >
                            {getStatusIcon(status)}
                            Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                          </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          onClick={() => handleToggleFeatured(ad)}
                          className="text-yellow-300 hover:bg-yellow-900 hover:text-yellow-200 cursor-pointer"
                        >
                          {ad.is_featured ? "Remove Featured Badge" : "Mark as Featured"}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          onClick={() => setDeleteDialog(ad)}
                          className="text-red-400 hover:bg-red-900 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Ad
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )})}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchAds()}
                    disabled={isFetchingMore}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {isFetchingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading more...
                      </>
                    ) : (
                      <>
                        Load more ({ads.length}/{totalCount || '∞'})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog
        open={!!statusChangeDialog}
        onOpenChange={(open) => {
          if (!open) {
            setStatusChangeDialog(null)
            setModerationNote("")
          }
        }}
      >
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Change Ad Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300 flex flex-wrap items-center gap-2">
              <span>Change status of</span>
              <strong className="text-white">{statusChangeDialog?.ad.title}</strong>
              <Badge variant="outline" className="border-gray-600 text-xs font-mono text-emerald-300">
                {statusChangeDialog?.ad ? getAdShortId(statusChangeDialog.ad.id) : ""}
              </Badge>
              <span>to</span>
              <strong className="text-white">{statusChangeDialog?.newStatus}</strong>.
            </p>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-400">Moderation Note</label>
              <Textarea
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                className="mt-2 bg-gray-700 border-gray-600 text-white"
                placeholder="Add context for this decision (visible to admins)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setStatusChangeDialog(null)
                setModerationNote("")
              }}
              className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (statusChangeDialog) {
                  handleStatusChange(statusChangeDialog.ad, statusChangeDialog.newStatus, moderationNote)
                }
              }}
              disabled={actionLoading === statusChangeDialog?.ad.id}
            >
              {actionLoading === statusChangeDialog?.ad.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Change Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="text-gray-400">
            Delete ad "<strong className="text-white">{deleteDialog?.title}</strong>"? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog(null)}
              className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteDialog) handleDeleteAd(deleteDialog.id)
              }}
              disabled={actionLoading === deleteDialog?.id}
            >
              {actionLoading === deleteDialog?.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Delete Ad'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ad Details Dialog */}
      <Dialog open={adDetailsOpen} onOpenChange={setAdDetailsOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ad Details</DialogTitle>
          </DialogHeader>
          {selectedAd && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Title</label>
                  <p className="text-white">{selectedAd.title}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Price</label>
                  <p className="text-white">${selectedAd.price}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Category</label>
                  <p className="text-white">{selectedAd.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Location</label>
                  <p className="text-white">{selectedAd.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedAd.status)}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Views</label>
                  <p className="text-white">{selectedAd.views}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400">Description</label>
                  <p className="text-white mt-1 whitespace-pre-wrap">{selectedAd.description}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400">User</label>
                  <p className="text-white">{selectedAd.user?.email || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Created</label>
                  <p className="text-white">{new Date(selectedAd.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Last Updated</label>
                  <p className="text-white">{new Date(selectedAd.updated_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Featured</label>
                  <p className="text-white">{selectedAd.is_featured ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Moderation Note</label>
                  <p className="text-white whitespace-pre-wrap">{selectedAd.moderation_note || 'No note recorded'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Clicks</label>
                  <p className="text-white">{selectedAd.clicks ?? '—'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEditDialog(selectedAd)} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
                  Edit Ad
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleToggleFeatured(selectedAd)} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
                  {selectedAd.is_featured ? 'Remove Featured' : 'Feature Ad'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const nextStatus = selectedAd.status === 'active' ? 'inactive' : 'active'
                    setStatusChangeDialog({ ad: selectedAd, newStatus: nextStatus })
                    setModerationNote(selectedAd.moderation_note ?? '')
                  }}
                  className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
                >
                  Mark as {selectedAd.status === 'active' ? 'Inactive' : 'Active'}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteDialog(selectedAd)}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Ad Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialog({ open: false, ad: null })
            setEditForm({
              title: "",
              price: "",
              category: "",
              location: "",
              description: "",
              status: "pending" as Product['status'],
              is_featured: false,
              moderation_note: "",
            })
          }
        }}
      >
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Ad</DialogTitle>
          </DialogHeader>

          {editDialog.ad && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-gray-400">Title</Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => handleEditFieldChange('title', e.target.value)}
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Price</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.price}
                    onChange={(e) => handleEditFieldChange('price', e.target.value)}
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Category</Label>
                  <Input
                    value={editForm.category}
                    onChange={(e) => handleEditFieldChange('category', e.target.value)}
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Location</Label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => handleEditFieldChange('location', e.target.value)}
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase text-gray-400">Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => handleEditFieldChange('description', e.target.value)}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-gray-400">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => handleEditFieldChange('status', value as Product['status'])}
                  >
                    <SelectTrigger className="mt-2 bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {['active', 'pending', 'inactive', 'rejected', 'sold', 'expired'].map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <Checkbox
                    checked={editForm.is_featured}
                    onCheckedChange={(checked) => handleEditFieldChange('is_featured', checked === true)}
                  />
                  <span className="text-sm text-gray-300">Feature this ad</span>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase text-gray-400">Moderation Note</Label>
                <Textarea
                  value={editForm.moderation_note}
                  onChange={(e) => handleEditFieldChange('moderation_note', e.target.value)}
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, ad: null })}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={actionLoading === `${editDialog.ad?.id}-edit`}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading === `${editDialog.ad?.id}-edit` ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
