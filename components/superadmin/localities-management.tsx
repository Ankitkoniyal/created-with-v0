// components/superadmin/localities-management.tsx
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Search,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Users,
  ListChecks,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Locality {
  id: string
  name: string
  city: string | null
  state: string | null
  pincode: string | null
  created_at: string
  item_count: number
  growth_rate?: number
  recent_count?: number
  previous_count?: number
  city_count?: number
  state_count?: number
  pincode_count?: number
}

interface LocalityForm {
  name: string
  city: string
  state: string
  pincode: string
}

interface LocalitySummary {
  locality: {
    id: string | null
    name: string
    city: string | null
    state: string | null
    pincode: string | null
    totalAds: number
  }
  statusBreakdown: Array<{ status: string; count: number }>
  categoryBreakdown: Array<{ category: string; count: number }>
  subcategoryBreakdown: Array<{ subcategory: string; category: string; count: number }>
  uniqueSellers: number
  priceStats: {
    average: number | null
    minimum: number | null
    maximum: number | null
  }
  recentAds: Array<{
    id: string
    title: string
    price: number | null
    status: string | null
    created_at: string
    category: string | null
    subcategory: string | null
  }>
}

const blankForm: LocalityForm = { name: "", city: "", state: "", pincode: "" }
const FALLBACK_LOCALITIES: Locality[] = [
  {
    id: "sample-1",
    name: "Downtown",
    city: "Sample City",
    state: "Sample State",
    pincode: "000001",
    created_at: new Date().toISOString(),
    item_count: 0,
  },
  {
    id: "sample-2",
    name: "Uptown",
    city: "Sample City",
    state: "Sample State",
    pincode: "000002",
    created_at: new Date().toISOString(),
    item_count: 0,
  },
  {
    id: "sample-3",
    name: "City Center",
    city: "Sample City",
    state: "Sample State",
    pincode: "000003",
    created_at: new Date().toISOString(),
    item_count: 0,
  },
]

export function LocalitiesManagement() {
  const supabase = createClient()
  const [localities, setLocalities] = useState<Locality[]>([])
  const [mostPopular, setMostPopular] = useState<{ localities: Locality[]; cities: Array<{ name: string; count: number }>; states: Array<{ name: string; count: number }>; pincodes: Array<{ name: string; count: number }> }>({ localities: [], cities: [], states: [], pincodes: [] })
  const [rising, setRising] = useState<{ localities: Locality[] }>({ localities: [] })
  const [subLocations, setSubLocations] = useState<{ cities: Array<{ name: string; count: number }>; states: Array<{ name: string; count: number }>; pincodes: Array<{ name: string; count: number }> }>({ cities: [], states: [], pincodes: [] })
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [totalCount, setTotalCount] = useState(0)
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "rising">("all")
  const [activeSubTab, setActiveSubTab] = useState<"localities" | "cities" | "states" | "pincodes">("localities")
  const [selectedLocalityId, setSelectedLocalityId] = useState<string | null>(null)
  const [selectedLocality, setSelectedLocality] = useState<Locality | null>(null)
  const [summary, setSummary] = useState<LocalitySummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [showDirectory, setShowDirectory] = useState(false)

  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; open: boolean; locality: Locality | null }>({
    mode: "create",
    open: false,
    locality: null,
  })
  const [form, setForm] = useState<LocalityForm>(blankForm)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] })

  const applyForm = (locality?: Locality | null) => {
    if (!locality) {
      setForm(blankForm)
      return
    }
    setForm({
      name: locality.name,
      city: locality.city ?? "",
      state: locality.state ?? "",
      pincode: locality.pincode ?? "",
    })
  }

  const loadLocalities = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/localities/list")
      const payload = await response.json().catch(() => ({ ok: false, error: "Failed to parse response" }))
      
      if (!response.ok || !payload.ok) {
        const errorMsg = payload.error || `HTTP ${response.status}: Failed to load localities`
        console.error("Localities API error:", errorMsg)
        // Use fallback data instead of throwing
        setLocalities(FALLBACK_LOCALITIES)
        setTotalCount(FALLBACK_LOCALITIES.length)
        if (!selectedLocalityId && FALLBACK_LOCALITIES.length > 0) {
          setSelectedLocalityId(FALLBACK_LOCALITIES[0].id)
          setSelectedLocality(FALLBACK_LOCALITIES[0])
        }
        toast.error("Using sample data - check API configuration")
        return
      }
      
      const list: Locality[] = payload.localities ?? FALLBACK_LOCALITIES
      setLocalities(list)
      setTotalCount(list.length)
      setMostPopular(payload.mostPopular ?? { localities: [], cities: [], states: [], pincodes: [] })
      setRising(payload.rising ?? { localities: [] })
      setSubLocations(payload.subLocations ?? { cities: [], states: [], pincodes: [] })
      if (!selectedLocalityId && list.length > 0) {
        setSelectedLocalityId(list[0].id)
        setSelectedLocality(list[0])
      } else if (selectedLocalityId) {
        const match = list.find((loc) => loc.id === selectedLocalityId)
        if (match) {
          setSelectedLocality(match)
        }
      }
    } catch (error) {
      console.error("Failed to load localities", error)
      // Use fallback data on any error
      setLocalities(FALLBACK_LOCALITIES)
      setTotalCount(FALLBACK_LOCALITIES.length)
      if (!selectedLocalityId && FALLBACK_LOCALITIES.length > 0) {
        setSelectedLocalityId(FALLBACK_LOCALITIES[0].id)
        setSelectedLocality(FALLBACK_LOCALITIES[0])
      }
      toast.error("Using sample data - check API configuration")
    } finally {
      setLoading(false)
    }
  }, [selectedLocalityId])

  const fetchSummary = useCallback(
    async (locality: Locality | null) => {
      if (!locality) return
      const params = new URLSearchParams()
      if (locality.id.startsWith("sample-")) {
        params.set("name", locality.name)
      } else {
        params.set("id", locality.id)
      }

      setSummaryLoading(true)
      setSummaryError(null)
      try {
        const response = await fetch(`/api/admin/localities/summary?${params.toString()}`)
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || "Failed to load locality insights")
        }
        const payload = await response.json()
        setSummary(payload.summary ?? null)
      } catch (error: any) {
        console.error("Failed to load locality summary", error)
        setSummary(null)
        setSummaryError(error?.message || "Unexpected error")
      } finally {
        setSummaryLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    loadLocalities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel("super-admin-localities")
      .on("postgres_changes", { event: "*", schema: "public", table: "localities" }, () => {
        loadLocalities()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const getDisplayData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const filterFunc = (item: any) => {
      if (!term) return true
      if (activeSubTab === "localities") {
        return [item.name, item.city ?? "", item.state ?? "", item.pincode ?? ""].some((value) =>
          value.toLowerCase().includes(term)
        )
      } else {
        return item.name.toLowerCase().includes(term)
      }
    }

    if (activeTab === "popular") {
      if (activeSubTab === "localities") {
        return mostPopular.localities.filter(filterFunc)
      } else if (activeSubTab === "cities") {
        return mostPopular.cities.filter(filterFunc)
      } else if (activeSubTab === "states") {
        return mostPopular.states.filter(filterFunc)
      } else {
        return mostPopular.pincodes.filter(filterFunc)
      }
    } else if (activeTab === "rising") {
      if (activeSubTab === "localities") {
        return rising.localities.filter(filterFunc)
      } else {
        // For rising, we only have localities data
        return []
      }
    } else {
      if (activeSubTab === "localities") {
        return localities.filter(filterFunc)
      } else if (activeSubTab === "cities") {
        return subLocations.cities.filter(filterFunc)
      } else if (activeSubTab === "states") {
        return subLocations.states.filter(filterFunc)
      } else {
        return subLocations.pincodes.filter(filterFunc)
      }
    }
  }, [activeTab, activeSubTab, localities, mostPopular, rising, subLocations, searchTerm])

  const filteredLocalities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return localities
    return localities.filter((locality) =>
      [locality.name, locality.city ?? "", locality.state ?? "", locality.pincode ?? ""].some((value) =>
        value.toLowerCase().includes(term),
      ),
    )
  }, [localities, searchTerm])

  const openCreateDialog = () => {
    setDialog({ mode: "create", open: true, locality: null })
    applyForm(null)
  }

  const openEditDialog = (locality: Locality) => {
    setDialog({ mode: "edit", open: true, locality })
    applyForm(locality)
  }

  const closeDialog = () => {
    setDialog({ mode: "create", open: false, locality: null })
    applyForm(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Locality name is required")
      return
    }

    setSaving(true)
    try {
      if (dialog.mode === "create") {
        const { data, error } = await supabase
          .from("localities")
          .insert({
            name: form.name.trim(),
            city: form.city.trim() || null,
            state: form.state.trim() || null,
            pincode: form.pincode.trim() || null,
          })
          .select()
          .single()

        if (error) throw error
        setLocalities((prev) => [{ ...data, item_count: 0 }, ...prev])
        setTotalCount((prev) => prev + 1)
        toast.success("Locality added")
      } else if (dialog.locality) {
        const { data, error } = await supabase
          .from("localities")
          .update({
            name: form.name.trim(),
            city: form.city.trim() || null,
            state: form.state.trim() || null,
            pincode: form.pincode.trim() || null,
          })
          .eq("id", dialog.locality.id)
          .select()
          .single()

        if (error) throw error
        setLocalities((prev) => prev.map((loc) => (loc.id === data.id ? { ...loc, ...data } : loc)))
        toast.success("Locality updated")
      }
      closeDialog()
    } catch (error: any) {
      console.error("Failed to save locality", error)
      toast.error(error.message || "Failed to save locality")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ids: string[]) => {
    setDeleteDialog({ open: false, ids: [] })
    const previous = localities
    setLocalities((prev) => prev.filter((loc) => !ids.includes(loc.id)))
    setTotalCount((prev) => Math.max(prev - ids.length, 0))

    try {
      const { error } = await supabase.from("localities").delete().in("id", ids)
      if (error) throw error
      toast.success(ids.length > 1 ? "Localities deleted" : "Locality deleted")
    } catch (error) {
      setLocalities(previous)
      setTotalCount((prev) => prev + ids.length)
      console.error("Delete failed", error)
      toast.error("Failed to delete locality")
    }
  }

  const toggleSelection = (id: string, checked: boolean | "indeterminate") => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked === true) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const selectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) setSelectedIds(new Set(filteredLocalities.map((loc) => loc.id)))
    else setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    if (!selectedIds.size) return
    setDeleteDialog({ open: true, ids: Array.from(selectedIds) })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadLocalities()
    if (selectedLocality) {
      await fetchSummary(selectedLocality)
    }
    toast.success("Localities refreshed")
    setRefreshing(false)
  }

  useEffect(() => {
    if (selectedLocality) {
      fetchSummary(selectedLocality)
    }
  }, [selectedLocality, fetchSummary])

  const handleLocalityChange = (value: string) => {
    setSelectedLocalityId(value)
    const match = localities.find((loc) => loc.id === value)
    if (match) {
      setSelectedLocality(match)
    } else {
      const fallback = localities.find((loc) => loc.name === value)
      setSelectedLocality(fallback ?? null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Localities Management</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700 animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const totalActiveAds =
    summary?.statusBreakdown.find((status) => status.status === "active")?.count ?? summary?.locality.totalAds ?? 0
  const totalPendingAds =
    summary?.statusBreakdown.find((status) => status.status === "pending")?.count ?? summary?.statusBreakdown?.[0]?.count ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Localities Management</h1>
          <p className="text-sm text-gray-400">
            Manage service areas and geographic coverage • Total: {totalCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDirectory((prev) => !prev)}
            className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
          >
            <ListChecks className="mr-2 h-4 w-4" /> {showDirectory ? "Hide directory" : "Manage directory"}
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} /> Refresh
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add locality
          </Button>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2">
            <Label className="text-xs uppercase text-gray-400">Select locality</Label>
            <Select
              value={selectedLocalityId ?? undefined}
              onValueChange={(value) => handleLocalityChange(value)}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Choose a locality" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border border-gray-700 text-white">
                <SelectGroup>
                  {localities.map((locality) => (
                    <SelectItem key={locality.id} value={locality.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{locality.name}</span>
                        <span className="text-xs text-gray-400">
                          {[locality.city, locality.state].filter(Boolean).join(", ") || "No region"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {summary && (
            <div className="grid gap-2 text-sm text-gray-300 sm:grid-cols-2 lg:grid-cols-3">
              <span>
                <span className="text-xs uppercase text-gray-500 block">City</span>
                {summary.locality.city ?? "—"}
              </span>
              <span>
                <span className="text-xs uppercase text-gray-500 block">State</span>
                {summary.locality.state ?? "—"}
              </span>
              <span>
                <span className="text-xs uppercase text-gray-500 block">Pincode</span>
                {summary.locality.pincode ?? "—"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Locality insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {summaryLoading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-gray-300">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              Loading locality metrics...
            </div>
          ) : summaryError ? (
            <div className="flex items-center gap-3 rounded-lg border border-red-700/70 bg-red-950/40 p-4 text-sm text-red-200">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              Unable to load insights for this locality ({summaryError}).
            </div>
          ) : summary ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="bg-gray-900/70 border border-gray-700/70">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide">
                      <MapPin className="h-4 w-4 text-emerald-400" /> Total ads
                    </div>
                    <div className="text-3xl font-bold text-white">{summary.locality.totalAds}</div>
                    <p className="text-xs text-gray-500">Listings currently associated with {summary.locality.name}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/70 border border-gray-700/70">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide">
                      <Activity className="h-4 w-4 text-green-400" /> Active ads
                    </div>
                    <div className="text-3xl font-bold text-white">{totalActiveAds}</div>
                    <p className="text-xs text-gray-500">Live listings ready for buyers</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/70 border border-gray-700/70">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide">
                      <Users className="h-4 w-4 text-sky-400" /> Unique sellers
                    </div>
                    <div className="text-3xl font-bold text-white">{summary.uniqueSellers}</div>
                    <p className="text-xs text-gray-500">Distinct accounts with listings in this area</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900/70 border border-gray-700/70">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide">
                      <TrendingUp className="h-4 w-4 text-yellow-400" /> Avg price
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {summary.priceStats.average !== null ? `$${summary.priceStats.average.toLocaleString()}` : "—"}
                    </div>
                    <p className="text-xs text-gray-500">
                      Range {summary.priceStats.minimum !== null ? `$${summary.priceStats.minimum.toLocaleString()}` : "—"} –{" "}
                      {summary.priceStats.maximum !== null ? `$${summary.priceStats.maximum.toLocaleString()}` : "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="bg-gray-900/70 border border-gray-700/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-white">
                      <BarChart3 className="h-4 w-4 text-blue-300" /> Status breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {summary.statusBreakdown.length === 0 ? (
                      <p className="text-sm text-gray-500">No ads recorded for this locality yet.</p>
                    ) : (
                      summary.statusBreakdown.map((item) => (
                        <div key={item.status} className="flex items-center justify-between rounded-lg bg-gray-800/60 px-3 py-2">
                          <span className="capitalize text-gray-200">{item.status.replace(/_/g, " ")}</span>
                          <Badge variant="outline" className="border-gray-600 text-gray-200">
                            {item.count}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/70 border border-gray-700/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-white">
                      <BarChart3 className="h-4 w-4 text-purple-300" /> Top categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {summary.categoryBreakdown.length === 0 ? (
                      <p className="text-sm text-gray-500">No categories recorded for this locality yet.</p>
                    ) : (
                      summary.categoryBreakdown
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 6)
                        .map((item) => (
                          <div
                            key={item.category}
                            className="flex items-center justify-between rounded-lg bg-gray-800/60 px-3 py-2"
                          >
                            <span className="text-gray-200">{item.category.replace(/-/g, " ")}</span>
                            <Badge variant="outline" className="border-gray-600 text-gray-200">
                              {item.count}
                            </Badge>
                          </div>
                        ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="bg-gray-900/70 border border-gray-700/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-white">Hot subcategories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {summary.subcategoryBreakdown.length === 0 ? (
                      <p className="text-sm text-gray-500">No subcategory data yet.</p>
                    ) : (
                      summary.subcategoryBreakdown
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 8)
                        .map((entry) => (
                          <div key={`${entry.category}-${entry.subcategory}`} className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-200">{entry.subcategory.replace(/-/g, " ")}</p>
                              <p className="text-xs text-gray-500">{entry.category}</p>
                            </div>
                            <Badge variant="outline" className="border-gray-600 text-gray-200">
                              {entry.count}
                            </Badge>
                          </div>
                        ))
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/70 border border-gray-700/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-white">Latest listings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {summary.recentAds.length === 0 ? (
                      <p className="text-sm text-gray-500">Nothing has been posted in this area yet.</p>
                    ) : (
                      summary.recentAds.map((ad) => (
                        <div key={ad.id} className="rounded-lg bg-gray-800/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-100 line-clamp-1">{ad.title}</p>
                            <Badge variant="outline" className="border-gray-600 text-gray-200">
                              {ad.status ?? "pending"}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-gray-400">
                            <span>{new Date(ad.created_at).toLocaleString()}</span>
                            <span>
                              {ad.price !== null ? `$${ad.price.toLocaleString()}` : "No price"} •{" "}
                              {ad.category ?? "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">Select a locality to view analytics.</div>
          )}
        </CardContent>
      </Card>

      {showDirectory && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center justify-between text-white">
              Directory
              {selectedIds.size > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.size})
                </Button>
              )}
            </CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filter by name, city, state, or pincode"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </CardHeader>
          <CardContent className="mt-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-700 pb-2 text-sm text-gray-400">
              <Checkbox
                checked={selectedIds.size === filteredLocalities.length && filteredLocalities.length > 0}
                onCheckedChange={selectAll}
              />
              <span>Select all ({filteredLocalities.length})</span>
            </div>
            {filteredLocalities.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No localities match the current filter.</div>
            ) : (
              filteredLocalities.map((locality) => (
                <Card key={locality.id} className="bg-gray-900/60 border border-gray-700">
                  <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 gap-3">
                      <Checkbox
                        className="mt-1"
                        checked={selectedIds.has(locality.id)}
                        onCheckedChange={(checked) => toggleSelection(locality.id, checked)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-emerald-300" />
                          <h3 className="text-base font-semibold text-white">{locality.name}</h3>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {locality.item_count} ads
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-400">
                          <span>City: {locality.city || "—"}</span>
                          <span>State: {locality.state || "—"}</span>
                          <span>Pincode: {locality.pincode || "—"}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Added on {new Date(locality.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-gray-700 text-gray-100 hover:bg-gray-600"
                        onClick={() => openEditDialog(locality)}
                      >
                        <Pencil className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-600/80 hover:bg-red-600"
                        onClick={() => setDeleteDialog({ open: true, ids: [locality.id] })}
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialog.open} onOpenChange={(open) => (!open ? closeDialog() : null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{dialog.mode === "create" ? "Add locality" : "Edit locality"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage supported service areas for marketplace listings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-xs uppercase text-gray-400">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                placeholder="Downtown"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs uppercase text-gray-400">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="City"
                />
              </div>
              <div>
                <Label className="text-xs uppercase text-gray-400">State / Province</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="State"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase text-gray-400">Pincode / Postal code</Label>
              <Input
                value={form.pincode}
                onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                placeholder="000000"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={closeDialog}
              className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : dialog.mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => (!open ? setDeleteDialog({ open: false, ids: [] }) : null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Delete locality</DialogTitle>
            <DialogDescription className="text-gray-400">
              This action removes the locality from the marketplace. Listings mapped to it will need manual review.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, ids: [] })}
              className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deleteDialog.ids)}
            >
              {deleteDialog.ids.length > 1 ? "Delete selected" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
