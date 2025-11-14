"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Search, Plus, Edit, Trash2, RefreshCw, UploadCloud, Loader2, TrendingUp, TrendingDown, BarChart3, Flame } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getCategorySlug, CATEGORY_CONFIG } from "@/lib/categories"
import { useAuth } from "@/hooks/use-auth"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  item_count: number
  created_at: string
  growth_rate?: number
  recent_count?: number
  previous_count?: number
  subcategories: Array<{
    name: string
    slug: string
    item_count: number
    growth_rate?: number
    recent_count?: number
    previous_count?: number
    category?: string
    categorySlug?: string
  }>
}

interface CategoryForm {
  name: string
  description: string
}

const logAdminAction = async (action: string, entityId: string, payload?: Record<string, unknown>) => {
  try {
    await fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, entityType: "category", entityId, payload }),
    })
  } catch (error) {
    console.warn("Audit log failed", error)
  }
}

const matchesSearch = (category: Category, term: string) => {
  const query = term.trim().toLowerCase()
  if (!query) return true
  return [category.name, category.description ?? "", category.slug].some((value) => value.toLowerCase().includes(query))
}

const buildFallbackCategories = (): Category[] =>
  CATEGORY_CONFIG.map((config) => ({
    id: `config-${config.slug}`,
    name: config.name,
    slug: config.slug,
    description: null,
    created_at: new Date().toISOString(),
    item_count: 0,
    subcategories: config.subcategories.map((sub) => ({
      name: sub.name,
      slug: sub.slug ?? getCategorySlug(sub.name),
      item_count: 0,
    })),
  }))

export function CategoriesManagement() {
  const supabase = createClient()
  const router = useRouter()
  const { user: currentUser, isAdmin } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [mostPopular, setMostPopular] = useState<{ categories: Category[]; subcategories: Category['subcategories'] }>({ categories: [], subcategories: [] })
  const [rising, setRising] = useState<{ categories: Category[]; subcategories: Category['subcategories'] }>({ categories: [], subcategories: [] })
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "rising">("all")
  const [activeSubTab, setActiveSubTab] = useState<"categories" | "subcategories">("categories")
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit"
    open: boolean
    category: Category | null
  }>({ mode: "create", open: false, category: null })
  const [form, setForm] = useState<CategoryForm>({ name: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.push("/")
    }
  }, [currentUser, isAdmin, router])

  const fetchCategories = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await fetch("/api/admin/categories/list")
      let payload: any = {}
      
      try {
        payload = await response.json()
      } catch (parseError) {
        // If JSON parsing fails, treat as unknown error
        console.warn("Failed to parse response as JSON", parseError)
      }
      
      if (!response.ok) {
        const errorMsg = payload.error || "Failed to load categories"
        console.error("API error:", errorMsg)
        setErrorMessage(errorMsg === "unknown_error" ? "Unable to connect to the server" : errorMsg)
        // Always set fallback categories when there's an error
        const fallback = buildFallbackCategories()
        setCategories(fallback)
        setMostPopular({ categories: [], subcategories: [] })
        setRising({ categories: [], subcategories: [] })
        toast.error(errorMsg === "unknown_error" ? "Using fallback categories" : "Failed to load categories")
        return
      }
      
      // Success case - set data from API
      setCategories(payload.categories ?? [])
      setMostPopular(payload.mostPopular ?? { categories: [], subcategories: [] })
      setRising(payload.rising ?? { categories: [], subcategories: [] })
      setErrorMessage(null)
    } catch (err) {
      console.error("Error fetching categories", err)
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      setErrorMessage(errorMsg)
      // Always set fallback categories on error
      const fallback = buildFallbackCategories()
      setCategories(fallback)
      setMostPopular({ categories: [], subcategories: [] })
      setRising({ categories: [], subcategories: [] })
      toast.error("Using fallback categories due to error")
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchCategories()
    }
  }, [isAdmin, fetchCategories])

  useEffect(() => {
    if (!isAdmin) return
    const channel = supabase
      .channel("super-admin-categories")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        fetchCategories()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin, supabase, fetchCategories])

  const openDialog = (mode: "create" | "edit", category?: Category) => {
    setDialog({ mode, open: true, category: category ?? null })
    if (category) {
      setForm({ name: category.name, description: category.description ?? "" })
    } else {
      setForm({ name: "", description: "" })
    }
  }

  const closeDialog = () => {
    setDialog({ mode: "create", open: false, category: null })
    setForm({ name: "", description: "" })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required")
      return
    }

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: getCategorySlug(form.name.trim()),
      description: form.description.trim() || null,
    }

    try {
      if (dialog.mode === "create") {
        const { error } = await supabase.from("categories").insert(payload)
        if (error) throw error
        await logAdminAction("create_category", payload.slug, payload)
        toast.success("Category created")
      } else if (dialog.category) {
        const { error } = await supabase.from("categories").update(payload).eq("id", dialog.category.id)
        if (error) throw error
        await logAdminAction("update_category", dialog.category.id, payload)
        toast.success("Category updated")
      }
      closeDialog()
      fetchCategories()
    } catch (err: any) {
      console.error("Saving category failed", err)
      toast.error(err?.message || "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    setDeleteConfirm(null)
    const previous = categories
    setCategories((prev) => prev.filter((cat) => cat.id !== category.id))

    try {
      const { error } = await supabase.from("categories").delete().eq("id", category.id)
      if (error) throw error
      await logAdminAction("delete_category", category.id)
      toast.success("Category deleted")
    } catch (err) {
      console.error("Delete failed", err)
      toast.error("Failed to delete category")
      setCategories(previous)
    }
  }

  const syncWithConfig = async () => {
    setSyncing(true)
    try {
      const existingSlugs = new Set(categories.map((cat) => cat.slug))
      const inserts = CATEGORY_CONFIG.filter((config) => !existingSlugs.has(config.slug)).map((config) => ({
        name: config.name,
        slug: config.slug,
        description: null,
      }))

      if (!inserts.length) {
        toast.info("Categories are already in sync")
        return
      }

      const { error } = await supabase.from("categories").insert(inserts)
      if (error) throw error

      await logAdminAction("sync_categories", "bulk", { inserted: inserts.length })
      toast.success(`Added ${inserts.length} categories from config`)
      fetchCategories()
    } catch (err) {
      console.error("Sync failed", err)
      toast.error("Failed to sync categories")
    } finally {
      setSyncing(false)
    }
  }

  const getDisplayData = useMemo(() => {
    if (activeTab === "popular") {
      return activeSubTab === "categories" 
        ? mostPopular.categories.filter((cat) => matchesSearch(cat, searchTerm))
        : mostPopular.subcategories.filter((sub) => 
            searchTerm ? sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || sub.category?.toLowerCase().includes(searchTerm.toLowerCase()) : true
          )
    } else if (activeTab === "rising") {
      return activeSubTab === "categories"
        ? rising.categories.filter((cat) => matchesSearch(cat, searchTerm))
        : rising.subcategories.filter((sub) =>
            searchTerm ? sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || sub.category?.toLowerCase().includes(searchTerm.toLowerCase()) : true
          )
    } else {
      return activeSubTab === "categories"
        ? categories.filter((category) => matchesSearch(category, searchTerm))
        : categories.flatMap((cat) => 
            cat.subcategories.map((sub) => ({ ...sub, category: cat.name, categorySlug: cat.slug }))
          ).filter((sub) =>
            searchTerm ? sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || sub.category?.toLowerCase().includes(searchTerm.toLowerCase()) : true
          )
    }
  }, [activeTab, activeSubTab, categories, mostPopular, rising, searchTerm])

  const filteredCategories = useMemo(
    () => categories.filter((category) => matchesSearch(category, searchTerm)),
    [categories, searchTerm],
  )

  const totalListings = filteredCategories.reduce((acc, category) => acc + (category.item_count ?? 0), 0)

  const toggleSelection = (categoryId: string, checked: boolean | "indeterminate") => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked === true) {
        next.add(categoryId)
      } else {
        next.delete(categoryId)
      }
      return next
    })
  }

  const selectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelected(new Set(filteredCategories.map((cat) => cat.id)))
    } else {
      setSelected(new Set())
    }
  }

  const bulkDelete = async () => {
    if (!selected.size) return
    const ids = Array.from(selected)
    const previous = categories
    setCategories((prev) => prev.filter((cat) => !selected.has(cat.id)))
    setSelected(new Set())

    try {
      const { error } = await supabase.from("categories").delete().in("id", ids)
      if (error) throw error
      await logAdminAction("bulk_delete_categories", "bulk", { ids })
      toast.success(`Deleted ${ids.length} categories`)
    } catch (err) {
      toast.error("Bulk delete failed")
      setCategories(previous)
    }
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Categories Management</h1>
          <p className="text-sm text-gray-400">
            Total categories: {categories.length} • Selected: {selected.size} • Listings tracked: {totalListings}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="bg-gray-700 text-gray-100 border border-gray-600 hover:bg-gray-600"
            onClick={fetchCategories}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            variant="secondary"
            className="bg-blue-600/20 text-blue-200 border border-blue-500/40 hover:bg-blue-600/30"
            onClick={syncWithConfig}
            disabled={syncing}
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
            Sync from config
          </Button>
          {selected.size > 0 && (
            <Button variant="destructive" className="bg-red-600/80 hover:bg-red-600" onClick={bulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete selected ({selected.size})
            </Button>
          )}
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => openDialog("create")}>
            <Plus className="w-4 h-4 mr-2" /> Add category
          </Button>
        </div>
      </div>

      {/* Tabs for All/Popular/Rising */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Main Tabs */}
            <div className="flex gap-2 border-b border-gray-700 pb-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-gray-700 text-white border-b-2 border-green-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                All {activeSubTab === "categories" ? "Categories" : "Subcategories"}
              </button>
              <button
                onClick={() => setActiveTab("popular")}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === "popular"
                    ? "bg-gray-700 text-white border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Most Popular
              </button>
              <button
                onClick={() => setActiveTab("rising")}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === "rising"
                    ? "bg-gray-700 text-white border-b-2 border-orange-500"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Flame className="w-4 h-4 inline mr-2" />
                Rising
              </button>
            </div>

            {/* Sub Tabs for Categories/Subcategories */}
            {activeTab !== "all" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveSubTab("categories")}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeSubTab === "categories"
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  Categories
                </button>
                <button
                  onClick={() => setActiveSubTab("subcategories")}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeSubTab === "subcategories"
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  Subcategories
                </button>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search ${activeSubTab === "categories" ? "categories" : "subcategories"}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Card className="bg-red-900/30 border border-red-800 text-red-200">
          <CardContent className="p-4 text-sm">
            Unable to load categories from Supabase ({errorMessage}). Displaying cached defaults until the table is ready.
          </CardContent>
        </Card>
      )}

      {/* Display Categories or Subcategories */}
      {activeSubTab === "categories" ? (
        <Card className="bg-gray-800 border-gray-700 overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="border-b border-gray-700 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {activeTab === "all" && (
                      <Checkbox
                        checked={selected.size === filteredCategories.length && filteredCategories.length > 0}
                        onCheckedChange={selectAll}
                      />
                    )}
                    Category
                  </div>
                </th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Total Items</th>
                {(activeTab === "popular" || activeTab === "rising") && (
                  <>
                    <th className="py-3 px-4">Growth</th>
                    <th className="py-3 px-4">Recent (7d)</th>
                  </>
                )}
                <th className="py-3 px-4">Top Subcategories</th>
                {activeTab === "all" && <th className="py-3 px-4">Created</th>}
                {activeTab === "all" && <th className="py-3 px-4">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === "all" ? 8 : 6} className="py-10 text-center text-gray-400">
                    Loading categories...
                  </td>
                </tr>
              ) : (getDisplayData as Category[]).length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "all" ? 8 : 6} className="py-10 text-center text-gray-400">
                    No categories found.
                  </td>
                </tr>
              ) : (
                (getDisplayData as Category[]).map((category) => (
                  <tr key={category.id} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/30">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {activeTab === "all" && (
                          <Checkbox
                            checked={selected.has(category.id)}
                            onCheckedChange={(checked) => toggleSelection(category.id, checked)}
                          />
                        )}
                        <span className="font-semibold text-white">{category.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-400">{category.description || "No description"}</td>
                    <td className="py-4 px-4 text-gray-500 font-mono text-xs">{category.slug}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {category.item_count.toLocaleString()}
                      </Badge>
                    </td>
                    {(activeTab === "popular" || activeTab === "rising") && (
                      <>
                        <td className="py-4 px-4">
                          {category.growth_rate !== undefined && (
                            <div className="flex items-center gap-1">
                              {category.growth_rate > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                              ) : category.growth_rate < 0 ? (
                                <TrendingDown className="w-4 h-4 text-red-400" />
                              ) : null}
                              <span className={category.growth_rate > 0 ? "text-green-400" : category.growth_rate < 0 ? "text-red-400" : "text-gray-400"}>
                                {category.growth_rate > 0 ? "+" : ""}{category.growth_rate.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="border-blue-500 text-blue-300">
                            {category.recent_count ?? 0}
                          </Badge>
                        </td>
                      </>
                    )}
                    <td className="py-4 px-4">
                      {category.subcategories.length === 0 ? (
                        <span className="text-xs text-gray-500">No subcategories</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {category.subcategories
                            .filter((sub) => sub.item_count > 0)
                            .sort((a, b) => b.item_count - a.item_count)
                            .slice(0, 3)
                            .map((sub) => (
                              <Badge
                                key={`${category.id}-${sub.slug}`}
                                variant="outline"
                                className="border-gray-600 text-gray-200 bg-gray-700/70 text-xs"
                              >
                                {sub.name} ({sub.item_count})
                              </Badge>
                            ))}
                          {category.subcategories.filter((sub) => sub.item_count > 0).length > 3 && (
                            <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                              +{category.subcategories.filter((sub) => sub.item_count > 0).length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    {activeTab === "all" && (
                      <>
                        <td className="py-4 px-4 text-gray-400">{new Date(category.created_at).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" className="bg-gray-700 text-gray-100 hover:bg-gray-600" onClick={() => openDialog("edit", category)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="bg-red-600/80 hover:bg-red-600"
                              onClick={() => setDeleteConfirm(category)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="bg-gray-800 border-gray-700 overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="border-b border-gray-700 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="py-3 px-4">Subcategory</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Total Items</th>
                {(activeTab === "popular" || activeTab === "rising") && (
                  <>
                    <th className="py-3 px-4">Growth</th>
                    <th className="py-3 px-4">Recent (7d)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === "all" ? 4 : 6} className="py-10 text-center text-gray-400">
                    Loading subcategories...
                  </td>
                </tr>
              ) : (getDisplayData as Category['subcategories']).length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "all" ? 4 : 6} className="py-10 text-center text-gray-400">
                    No subcategories found.
                  </td>
                </tr>
              ) : (
                (getDisplayData as Category['subcategories']).map((sub, index) => (
                  <tr key={`${sub.categorySlug || sub.category || 'unknown'}-${sub.slug}-${index}`} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/30">
                    <td className="py-4 px-4">
                      <span className="font-semibold text-white">{sub.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {sub.category || "Unknown"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-mono text-xs">{sub.slug}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {sub.item_count.toLocaleString()}
                      </Badge>
                    </td>
                    {(activeTab === "popular" || activeTab === "rising") && (
                      <>
                        <td className="py-4 px-4">
                          {sub.growth_rate !== undefined && (
                            <div className="flex items-center gap-1">
                              {sub.growth_rate > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                              ) : sub.growth_rate < 0 ? (
                                <TrendingDown className="w-4 h-4 text-red-400" />
                              ) : null}
                              <span className={sub.growth_rate > 0 ? "text-green-400" : sub.growth_rate < 0 ? "text-red-400" : "text-gray-400"}>
                                {sub.growth_rate > 0 ? "+" : ""}{sub.growth_rate.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="border-blue-500 text-blue-300">
                            {sub.recent_count ?? 0}
                          </Badge>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={dialog.open} onOpenChange={(open) => (!open ? closeDialog() : null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{dialog.mode === "create" ? "Add new category" : "Edit category"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Slug is generated automatically based on the category name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase text-gray-400">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Category name"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-xs uppercase text-gray-400">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="rounded-md bg-gray-900/60 p-3 text-xs text-gray-400">
              Slug preview: <span className="font-mono text-green-400">{getCategorySlug(form.name || "")}</span>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={closeDialog} className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : dialog.mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => (!open ? setDeleteConfirm(null) : null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will remove the category. Products referencing it will need manual updates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
