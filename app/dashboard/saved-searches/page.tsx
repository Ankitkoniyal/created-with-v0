"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { 
  Search, 
  Bell, 
  Trash2, 
  Edit, 
  X, 
  Check,
  AlertCircle,
  MapPin,
  Tag,
  DollarSign
} from "lucide-react"
import { useRouter } from "next/navigation"

interface SavedSearch {
  id: string
  name: string
  search_query?: string
  category?: string
  subcategory?: string
  location?: string
  province?: string
  city?: string
  min_price?: number
  max_price?: number
  condition?: string
  is_active: boolean
  email_alerts: boolean
  created_at: string
}

export default function SavedSearchesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    fetchSearches()
  }, [user])

  const fetchSearches = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch("/api/saved-searches")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setSearches(data.searches || [])
    } catch (error) {
      console.error("Error fetching saved searches:", error)
      toast.error("Failed to load saved searches")
    } finally {
      setLoading(false)
    }
  }

  const deleteSearch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved search?")) return

    try {
      const response = await fetch(`/api/saved-searches?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")
      
      toast.success("Saved search deleted")
      fetchSearches()
    } catch (error) {
      toast.error("Failed to delete saved search")
    }
  }

  const toggleActive = async (search: SavedSearch) => {
    try {
      const response = await fetch("/api/saved-searches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: search.id,
          is_active: !search.is_active,
        }),
      })

      if (!response.ok) throw new Error("Failed to update")
      
      toast.success(search.is_active ? "Search deactivated" : "Search activated")
      fetchSearches()
    } catch (error) {
      toast.error("Failed to update search")
    }
  }

  const toggleEmailAlerts = async (search: SavedSearch) => {
    try {
      const response = await fetch("/api/saved-searches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: search.id,
          email_alerts: !search.email_alerts,
        }),
      })

      if (!response.ok) throw new Error("Failed to update")
      
      toast.success(search.email_alerts ? "Email alerts disabled" : "Email alerts enabled")
      fetchSearches()
    } catch (error) {
      toast.error("Failed to update email alerts")
    }
  }

  const updateSearchName = async (id: string) => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty")
      return
    }

    try {
      const response = await fetch("/api/saved-searches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName.trim(),
        }),
      })

      if (!response.ok) throw new Error("Failed to update")
      
      toast.success("Search name updated")
      setEditingId(null)
      fetchSearches()
    } catch (error) {
      toast.error("Failed to update search name")
    }
  }

  const buildSearchUrl = (search: SavedSearch) => {
    const params = new URLSearchParams()
    if (search.search_query) params.set("q", search.search_query)
    if (search.category) params.set("category", search.category)
    if (search.subcategory) params.set("subcategory", search.subcategory)
    if (search.location) params.set("location", search.location)
    if (search.city) params.set("city", search.city)
    if (search.province) params.set("province", search.province)
    if (search.min_price) params.set("min_price", search.min_price.toString())
    if (search.max_price) params.set("max_price", search.max_price.toString())
    if (search.condition) params.set("condition", search.condition)
    return `/search?${params.toString()}`
  }

  const getSearchDescription = (search: SavedSearch) => {
    const parts: string[] = []
    if (search.search_query) parts.push(`"${search.search_query}"`)
    if (search.category) parts.push(`in ${search.category}`)
    if (search.location || search.city) {
      const loc = search.city || search.location
      parts.push(`in ${loc}`)
    }
    if (search.min_price || search.max_price) {
      const priceRange = []
      if (search.min_price) priceRange.push(`$${search.min_price}`)
      if (search.max_price) priceRange.push(`$${search.max_price}`)
      parts.push(`(${priceRange.join(" - ")})`)
    }
    return parts.join(" ") || "Saved search"
  }

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <DashboardNav />
              <div className="lg:col-span-3">
                <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <DashboardNav />
            
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Saved Searches
                    </CardTitle>
                    <Button
                      onClick={() => router.push("/search")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Go to Search
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {searches.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No saved searches yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Save your search criteria to get alerts when new matching items are posted
                      </p>
                      <Button
                        onClick={() => router.push("/search")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Start Searching
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searches.map((search) => (
                        <Card key={search.id} className={!search.is_active ? "opacity-60" : ""}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {editingId === search.id ? (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Input
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="flex-1"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => updateSearchName(search.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingId(null)
                                        setEditName("")
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg">{search.name}</h3>
                                    {!search.is_active && (
                                      <Badge variant="secondary">Inactive</Badge>
                                    )}
                                    {search.email_alerts && (
                                      <Badge variant="outline" className="flex items-center gap-1">
                                        <Bell className="h-3 w-3" />
                                        Alerts On
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                
                                <p className="text-sm text-muted-foreground mb-3">
                                  {getSearchDescription(search)}
                                </p>
                                
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {search.category && (
                                    <div className="flex items-center gap-1">
                                      <Tag className="h-3 w-3" />
                                      {search.category}
                                    </div>
                                  )}
                                  {(search.city || search.location) && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {search.city || search.location}
                                    </div>
                                  )}
                                  {(search.min_price || search.max_price) && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {search.min_price ? `$${search.min_price}` : "Any"} - {search.max_price ? `$${search.max_price}` : "Any"}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(buildSearchUrl(search))}
                                >
                                  View Results
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingId(search.id)
                                    setEditName(search.name)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteSearch(search.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={search.is_active}
                                  onCheckedChange={() => toggleActive(search)}
                                />
                                <Label className="text-sm">Active</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={search.email_alerts}
                                  onCheckedChange={() => toggleEmailAlerts(search)}
                                />
                                <Label className="text-sm">Email Alerts</Label>
                              </div>
                              <span className="text-xs text-muted-foreground ml-auto">
                                Saved {new Date(search.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

