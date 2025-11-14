"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Ban,
  FileText,
  Users,
  RefreshCw,
  Loader2,
  Eye,
  Calendar,
  AlertTriangle,
  XCircle,
  CheckCircle,
  User,
  MapPin,
  Tag,
  Phone,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface DeactivatedAd {
  id: string
  product_id: string
  title: string
  description: string
  price: number
  category: string
  location?: string | null
  status: string
  status_before?: string | null
  status_after: string
  views: number
  created_at: string
  updated_at: string
  user_id: string
  moderation_note?: string | null
  reason?: string | null
  deactivated_by?: string | null
  deactivated_by_email?: string | null
  user?: {
    email: string
    full_name?: string | null
  }
}

interface BannedUser {
  id: string
  user_id: string
  email: string
  full_name?: string | null
  phone?: string | null
  status: string
  status_before?: string | null
  status_after: string
  created_at: string
  updated_at?: string | null
  banned_at: string
  banned_by?: string | null
  banned_by_email?: string | null
  ban_reason: string
  ad_count?: number
  expires_at?: string | null
  is_active: boolean
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value ?? 0)

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "inactive":
      return "outline"
    case "deleted":
      return "destructive"
    case "banned":
      return "destructive"
    case "deactivated":
      return "outline"
    case "suspended":
      return "secondary"
    default:
      return "outline"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "inactive":
      return "text-yellow-300 border-yellow-500"
    case "deleted":
      return "text-red-300 border-red-500"
    case "banned":
      return "text-red-300 border-red-500"
    case "deactivated":
      return "text-gray-300 border-gray-500"
    case "suspended":
      return "text-orange-300 border-orange-500"
    default:
      return "text-gray-300 border-gray-500"
  }
}

export function Moderation() {
  const supabase = createClient()
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<"ads" | "users">("ads")
  const [deactivatedAds, setDeactivatedAds] = useState<DeactivatedAd[]>([])
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAd, setSelectedAd] = useState<DeactivatedAd | null>(null)
  const [selectedUser, setSelectedUser] = useState<BannedUser | null>(null)
  const [adDialogOpen, setAdDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)

  const fetchDeactivatedAds = useCallback(async () => {
    if (!isAdmin) return
    try {
      // Fetch from deactivated_ads table with product details
      const { data: deactivatedData, error: deactivatedError } = await supabase
        .from("deactivated_ads")
        .select(`
          id,
          product_id,
          reason,
          status_before,
          status_after,
          moderation_note,
          created_at,
          deactivated_by,
          products:product_id (
            id,
            title,
            description,
            price,
            category,
            location,
            status,
            views,
            created_at,
            updated_at,
            user_id,
            profiles:user_id (
              email,
              full_name
            )
          ),
          deactivated_by_profile:deactivated_by (
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (deactivatedError) {
        console.error("Deactivated ads query error:", deactivatedError)
        // Fallback to old method if table doesn't exist yet
        const { data: adsData, error: adsError } = await supabase
          .from("products")
          .select("id, title, description, price, category, location, status, views, created_at, updated_at, user_id, moderation_note, moderated_by, moderated_at")
          .in("status", ["inactive", "deleted", "rejected", "deactivated"])
          .order("updated_at", { ascending: false })

        if (adsError) {
          setDeactivatedAds([])
          return
        }

        const userIds = [...new Set((adsData || []).map((ad: any) => ad.user_id).filter(Boolean))]
        const userMap = new Map()

        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .in("id", userIds)

          if (usersData) {
            usersData.forEach((user: any) => {
              userMap.set(user.id, user)
            })
          }
        }

        const transformed = (adsData || []).map((ad: any) => {
          const user = userMap.get(ad.user_id)
          return {
            id: ad.id,
            product_id: ad.id,
            title: ad.title || "Untitled",
            description: ad.description || "",
            price: ad.price ?? 0,
            category: ad.category || "Uncategorized",
            location: ad.location,
            status: ad.status || "inactive",
            status_after: ad.status || "inactive",
            views: ad.views ?? 0,
            created_at: ad.created_at,
            updated_at: ad.updated_at,
            user_id: ad.user_id,
            moderation_note: ad.moderation_note,
            reason: null,
            deactivated_by: ad.moderated_by,
            user: user ? { email: user.email, full_name: user.full_name } : undefined,
          }
        })

        setDeactivatedAds(transformed)
        return
      }

      // Transform the data from the new table structure
      const transformed = (deactivatedData || []).map((item: any) => {
        const product = item.products
        const user = product?.profiles
        return {
          id: product?.id || item.product_id,
          product_id: item.product_id,
          title: product?.title || "Untitled",
          description: product?.description || "",
          price: product?.price ?? 0,
          category: product?.category || "Uncategorized",
          location: product?.location,
          status: item.status_after,
          status_before: item.status_before,
          status_after: item.status_after,
          views: product?.views ?? 0,
          created_at: product?.created_at || item.created_at,
          updated_at: product?.updated_at || item.created_at,
          user_id: product?.user_id || "",
          moderation_note: item.moderation_note,
          reason: item.reason,
          deactivated_by: item.deactivated_by,
          deactivated_by_email: item.deactivated_by_profile?.email,
          user: user ? { email: user.email, full_name: user.full_name } : undefined,
        }
      })

      setDeactivatedAds(transformed)
    } catch (error: any) {
      console.error("Failed to fetch deactivated ads", {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      })
      const errorMessage = error?.message || error?.code || error?.details || "Unknown error occurred"
      toast.error(`Failed to load deactivated ads: ${errorMessage}`)
      setDeactivatedAds([])
    }
  }, [isAdmin, supabase])

  const fetchBannedUsers = useCallback(async () => {
    if (!isAdmin) return
    try {
      // Fetch from banned_users table with user details
      const { data: bannedData, error: bannedError } = await supabase
        .from("banned_users")
        .select(`
          id,
          user_id,
          reason,
          status_before,
          status_after,
          banned_at,
          expires_at,
          is_active,
          created_at,
          banned_by,
          profiles:user_id (
            id,
            email,
            full_name,
            phone,
            created_at,
            updated_at
          ),
          banned_by_profile:banned_by (
            email
          )
        `)
        .eq("is_active", true)
        .order("banned_at", { ascending: false })

      if (bannedError) {
        console.error("Banned users query error:", bannedError)
        // Fallback to old method if table doesn't exist yet
        const { data: allProfiles, error: allError } = await supabase
          .from("profiles")
          .select("id, email, full_name, phone, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(500)

        if (allError) {
          setBannedUsers([])
          return
        }

        // Try to get account_status from auth.users metadata
        const usersWithAdCounts = await Promise.all(
          (allProfiles || []).map(async (profile: any) => {
            try {
              const { count } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("user_id", profile.id)

              // Check auth.users for account_status
              const { data: authUser } = await supabase.auth.admin.getUserById(profile.id).catch(() => ({ data: null }))
              const accountStatus = authUser?.user?.user_metadata?.account_status

              if (accountStatus !== "banned" && accountStatus !== "deactivated" && accountStatus !== "suspended") {
                return null
              }

              return {
                id: profile.id,
                user_id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                phone: profile.phone,
                status: accountStatus || "active",
                status_after: accountStatus || "active",
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                banned_at: profile.updated_at,
                ban_reason: null,
                ad_count: count || 0,
                is_active: true,
              }
            } catch (err) {
              return null
            }
          })
        )

        setBannedUsers(usersWithAdCounts.filter(Boolean))
        return
      }

      // Get ad counts for each user
      const usersWithAdCounts = await Promise.all(
        (bannedData || []).map(async (item: any) => {
          try {
            const profile = item.profiles
            const { count } = await supabase
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("user_id", item.user_id)

            return {
              id: item.id,
              user_id: item.user_id,
              email: profile?.email || "",
              full_name: profile?.full_name,
              phone: profile?.phone,
              status: item.status_after,
              status_before: item.status_before,
              status_after: item.status_after,
              created_at: profile?.created_at || item.created_at,
              updated_at: profile?.updated_at,
              banned_at: item.banned_at,
              banned_by: item.banned_by,
              banned_by_email: item.banned_by_profile?.email,
              ban_reason: item.reason,
              ad_count: count || 0,
              expires_at: item.expires_at,
              is_active: item.is_active,
            }
          } catch (err) {
            console.warn(`Error processing banned user ${item.user_id}:`, err)
            return null
          }
        })
      )

      setBannedUsers(usersWithAdCounts.filter(Boolean))
    } catch (error: any) {
      console.error("Failed to fetch banned users", {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack
      })
      const errorMessage = error?.message || error?.code || error?.details || "Unknown error occurred"
      toast.error(`Failed to load banned users: ${errorMessage}`)
      setBannedUsers([])
    }
  }, [isAdmin, supabase])

  const loadData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchDeactivatedAds(), fetchBannedUsers()])
    setLoading(false)
  }, [fetchDeactivatedAds, fetchBannedUsers])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    toast.success("Moderation data refreshed")
    setRefreshing(false)
  }

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin, loadData])

  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel("moderation-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deactivated_ads" },
        () => {
          fetchDeactivatedAds()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banned_users" },
        () => {
          fetchBannedUsers()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchDeactivatedAds()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin, supabase, fetchDeactivatedAds, fetchBannedUsers])

  const filteredAds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return deactivatedAds
    return deactivatedAds.filter(
      (ad) =>
        ad.title.toLowerCase().includes(query) ||
        ad.description.toLowerCase().includes(query) ||
        ad.category.toLowerCase().includes(query) ||
        ad.user?.email.toLowerCase().includes(query) ||
        ad.id.toLowerCase().includes(query)
    )
  }, [deactivatedAds, searchQuery])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return bannedUsers
    return bannedUsers.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query) ||
        user.phone?.includes(query) ||
        user.id.toLowerCase().includes(query)
    )
  }, [bannedUsers, searchQuery])

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-400">Access denied</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Moderation</h1>
          <p className="text-sm text-gray-400">
            View deactivated ads and banned users • Track moderation actions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", (refreshing || loading) && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={`Search ${activeTab === "ads" ? "ads" : "users"}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-700 border-gray-600 text-white"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ads" | "users")} className="w-full">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="ads" className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white">
            <FileText className="mr-2 h-4 w-4" /> Deactivated Ads ({deactivatedAds.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white">
            <Users className="mr-2 h-4 w-4" /> Banned Users ({bannedUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ads" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Deactivated Ads</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-12 text-gray-300">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  Loading deactivated ads...
                </div>
              ) : filteredAds.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Ban className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg font-medium">No deactivated ads found</p>
                  <p className="text-sm mt-2">
                    {searchQuery ? "Try adjusting your search query" : "Ads that are inactive, deleted, or rejected will appear here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAds.map((ad) => (
                    <Card key={ad.id} className="bg-gray-900/60 border border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-white line-clamp-1">{ad.title}</h3>
                                  <Badge
                                    variant={getStatusBadgeVariant(ad.status)}
                                    className={getStatusColor(ad.status)}
                                  >
                                    {ad.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-2">{ad.description}</p>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" /> {ad.category}
                                  </span>
                                  {ad.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" /> {ad.location}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> {ad.views} views
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> {new Date(ad.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {ad.reason && (
                                  <div className="mt-2 p-2 bg-red-900/20 border border-red-700/50 rounded text-sm text-red-200">
                                    <strong>Reason:</strong> {ad.reason}
                                  </div>
                                )}
                                {ad.moderation_note && (
                                  <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-sm text-yellow-200">
                                    <strong>Moderation note:</strong> {ad.moderation_note}
                                  </div>
                                )}
                                {ad.user && (
                                  <div className="mt-2 text-sm text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" /> {ad.user.email} {ad.user.full_name && `(${ad.user.full_name})`}
                                    </span>
                                  </div>
                                )}
                                {ad.deactivated_by_email && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    Deactivated by: {ad.deactivated_by_email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAd(ad)
                                setAdDialogOpen(true)
                              }}
                              className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
                            >
                              <Eye className="mr-1 h-4 w-4" /> View Details
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
                          <span className="font-semibold text-gray-400">{formatCurrency(ad.price)}</span>
                          {ad.status_before && (
                            <span className="ml-4">
                              Status changed from <span className="font-medium">{ad.status_before}</span> to <span className="font-medium">{ad.status_after}</span>
                            </span>
                          )}
                          <span className="ml-4">
                            Deactivated on {new Date(ad.created_at).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Banned Users</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-12 text-gray-300">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  Loading banned users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Ban className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg font-medium">No banned users found</p>
                  <p className="text-sm mt-2">
                    {searchQuery ? "Try adjusting your search query" : "Users that are banned, deactivated, or suspended will appear here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="bg-gray-900/60 border border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-white">{user.full_name || "Unnamed User"}</h3>
                              <Badge variant={getStatusBadgeVariant(user.status)} className={getStatusColor(user.status)}>
                                {user.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" /> {user.email}
                              </span>
                              {user.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {user.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" /> {user.ad_count || 0} ads
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Joined {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {user.ban_reason && (
                              <div className="mt-2 p-2 bg-red-900/20 border border-red-700/50 rounded text-sm text-red-200">
                                <strong>Ban reason:</strong> {user.ban_reason}
                              </div>
                            )}
                            {user.banned_by_email && (
                              <div className="mt-1 text-xs text-gray-500">
                                Banned by: {user.banned_by_email}
                              </div>
                            )}
                            {user.status_before && (
                              <div className="mt-1 text-xs text-gray-500">
                                Status changed from <span className="font-medium">{user.status_before}</span> to <span className="font-medium">{user.status_after}</span>
                              </div>
                            )}
                            {user.expires_at && (
                              <div className="mt-1 text-xs text-yellow-500">
                                Ban expires on {new Date(user.expires_at).toLocaleString()}
                              </div>
                            )}
                            <div className="mt-2 text-xs text-gray-500">
                              Banned on {new Date(user.banned_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user)
                                setUserDialogOpen(true)
                              }}
                              className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
                            >
                              <Eye className="mr-1 h-4 w-4" /> View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ad Details Dialog */}
      <Dialog open={adDialogOpen} onOpenChange={setAdDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAd?.title}</DialogTitle>
            <DialogDescription className="text-gray-400">Ad details and moderation history</DialogDescription>
          </DialogHeader>
          {selectedAd && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase text-gray-400">Description</Label>
                <p className="text-white mt-1">{selectedAd.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-gray-400">Price</Label>
                  <p className="text-white mt-1">{formatCurrency(selectedAd.price)}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Category</Label>
                  <p className="text-white mt-1">{selectedAd.category}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedAd.status)} className={getStatusColor(selectedAd.status)}>
                    {selectedAd.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Views</Label>
                  <p className="text-white mt-1">{selectedAd.views}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Created</Label>
                  <p className="text-white mt-1">{new Date(selectedAd.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Last Updated</Label>
                  <p className="text-white mt-1">{new Date(selectedAd.updated_at).toLocaleString()}</p>
                </div>
              </div>
              {selectedAd.user && (
                <div>
                  <Label className="text-xs uppercase text-gray-400">Owner</Label>
                  <p className="text-white mt-1">
                    {selectedAd.user.email} {selectedAd.user.full_name && `(${selectedAd.user.full_name})`}
                  </p>
                </div>
              )}
              {selectedAd.moderation_note && (
                <div>
                  <Label className="text-xs uppercase text-gray-400">Moderation Note</Label>
                  <p className="text-white mt-1 bg-yellow-900/20 p-2 rounded border border-yellow-700/50">
                    {selectedAd.moderation_note}
                  </p>
                </div>
              )}
              {selectedAd.moderated_at && (
                <div>
                  <Label className="text-xs uppercase text-gray-400">Moderated</Label>
                  <p className="text-white mt-1">{new Date(selectedAd.moderated_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdDialogOpen(false)}
              className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedUser?.full_name || selectedUser?.email}</DialogTitle>
            <DialogDescription className="text-gray-400">User details and ban information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-gray-400">Email</Label>
                  <p className="text-white mt-1">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedUser.status)} className={getStatusColor(selectedUser.status)}>
                    {selectedUser.status}
                  </Badge>
                </div>
                {selectedUser.full_name && (
                  <div>
                    <Label className="text-xs uppercase text-gray-400">Full Name</Label>
                    <p className="text-white mt-1">{selectedUser.full_name}</p>
                  </div>
                )}
                {selectedUser.phone && (
                  <div>
                    <Label className="text-xs uppercase text-gray-400">Phone</Label>
                    <p className="text-white mt-1">{selectedUser.phone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs uppercase text-gray-400">Total Ads</Label>
                  <p className="text-white mt-1">{selectedUser.ad_count || 0}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-gray-400">Joined</Label>
                  <p className="text-white mt-1">{new Date(selectedUser.created_at).toLocaleString()}</p>
                </div>
              </div>
              {selectedUser.ban_reason && (
                <div>
                  <Label className="text-xs uppercase text-gray-400">Ban Reason</Label>
                  <p className="text-white mt-1 bg-red-900/20 p-2 rounded border border-red-700/50">
                    {selectedUser.ban_reason}
                  </p>
                </div>
              )}
              {selectedUser.updated_at && (
                <div>
                  <Label className="text-xs uppercase text-gray-400">Status Changed</Label>
                  <p className="text-white mt-1">{new Date(selectedUser.updated_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserDialogOpen(false)}
              className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


