"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  created_at: string
  updated_at: string
  user_id: string
  images: string[] | null
  user?: {
    email: string
    full_name?: string | null
  }
}

export default function AdsManagement() {
  const [ads, setAds] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAd, setSelectedAd] = useState<Product | null>(null)
  const [adDetailsOpen, setAdDetailsOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<Product | null>(null)
  const [statusChangeDialog, setStatusChangeDialog] = useState<{ ad: Product; newStatus: Product['status'] } | null>(null)
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set())

  const { isAdmin, user: currentUser } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Redirect non-admins
  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.push("/")
    }
  }, [currentUser, isAdmin, router])

  // Fetch ads when component mounts and user is admin
  useEffect(() => {
    if (isAdmin) {
      fetchAds()
    } else if (isAdmin === false) {
      setLoading(false)
    }
  }, [isAdmin])

  // Fetch ads with user data
  const fetchAds = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching ads...")

      // Fetch products with user data in a single query using join
      const { data: adsData, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error("❌ Error fetching ads:", error)
        toast.error("Failed to load ads")
        setAds([])
        return
      }

      console.log("📊 Ads data:", adsData)

      // Transform the data to match our Product interface
      const transformedAds: Product[] = (adsData || []).map((ad: any) => ({
        id: ad.id,
        title: ad.title || 'Untitled',
        description: ad.description || '',
        price: ad.price || 0,
        category: ad.category || 'Uncategorized',
        location: ad.location,
        status: ad.status || 'pending',
        views: ad.views || 0,
        created_at: ad.created_at,
        updated_at: ad.updated_at,
        user_id: ad.user_id,
        images: ad.images || [],
        user: ad.profiles ? {
          email: ad.profiles.email,
          full_name: ad.profiles.full_name
        } : { email: 'Unknown User' }
      }))

      setAds(transformedAds)
      console.log(`✅ Loaded ${transformedAds.length} ads`)

    } catch (error) {
      console.error("❌ Unexpected error:", error)
      toast.error("Failed to load ads")
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  // Handle status change
  const handleStatusChange = async (adId: string, newStatus: Product['status']) => {
    setActionLoading(adId)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', adId)

      if (error) throw error

      // Update local state
      setAds(prev => prev.map(ad => 
        ad.id === adId ? { ...ad, status: newStatus } : ad
      ))

      toast.success(`Ad status updated to ${newStatus}`)
      setStatusChangeDialog(null)
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    } finally {
      setActionLoading(null)
    }
  }

  // Handle delete
  const handleDeleteAd = async (adId: string) => {
    setActionLoading(adId)
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', adId)

      if (error) throw error

      // Update local state
      setAds(prev => prev.filter(ad => ad.id !== adId))
      setSelectedAds(prev => {
        const newSet = new Set(prev)
        newSet.delete(adId)
        return newSet
      })

      toast.success("Ad deleted successfully")
      setDeleteDialog(null)
    } catch (error) {
      console.error("Error deleting ad:", error)
      toast.error("Failed to delete ad")
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
  const handleSelectAd = (adId: string, checked: boolean) => {
    setSelectedAds(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(adId)
      } else {
        newSet.delete(adId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAds(new Set(filteredAds.map(ad => ad.id)))
    } else {
      setSelectedAds(new Set())
    }
  }

  // Bulk actions
  const handleBulkStatusChange = async (newStatus: Product['status']) => {
    if (selectedAds.size === 0) return
    
    setActionLoading('bulk')
    try {
      const adIds = Array.from(selectedAds)
      const { error } = await supabase
        .from('products')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .in('id', adIds)

      if (error) throw error

      // Update local state
      setAds(prev => prev.map(ad => 
        selectedAds.has(ad.id) ? { ...ad, status: newStatus } : ad
      ))

      toast.success(`Updated ${selectedAds.size} ads`)
      setSelectedAds(new Set())
    } catch (error) {
      console.error("Error in bulk update:", error)
      toast.error("Failed to update ads")
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedAds.size === 0) return
    
    setActionLoading('bulk-delete')
    try {
      const adIds = Array.from(selectedAds)
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', adIds)

      if (error) throw error

      // Update local state
      setAds(prev => prev.filter(ad => !selectedAds.has(ad.id)))
      toast.success(`Deleted ${adIds.length} ads`)
      setSelectedAds(new Set())
    } catch (error) {
      console.error("Error in bulk delete:", error)
      toast.error("Failed to delete ads")
    } finally {
      setActionLoading(null)
    }
  }

  // Export functionality
  const exportAds = () => {
    const csvContent = [
      ['ID', 'Title', 'Price', 'Category', 'Location', 'Status', 'Views', 'User Email', 'Created At'],
      ...filteredAds.map(ad => [
        ad.id,
        `"${ad.title.replace(/"/g, '""')}"`,
        ad.price,
        ad.category,
        ad.location || '',
        ad.status,
        ad.views,
        ad.user?.email || 'Unknown',
        new Date(ad.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ads-export-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success("Ads exported successfully")
  }

  // Filter ads based on search and status
  const filteredAds = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return ads.filter(ad => {
      const matchesSearch = !query || 
        ad.title.toLowerCase().includes(query) ||
        ad.description.toLowerCase().includes(query) ||
        ad.category.toLowerCase().includes(query) ||
        (ad.location && ad.location.toLowerCase().includes(query)) ||
        (ad.user?.email && ad.user.email.toLowerCase().includes(query)) ||
        ad.id.toLowerCase().includes(query)
      
      const matchesStatus = statusFilter === 'all' || ad.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [ads, searchQuery, statusFilter])

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
      expired: Ban
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
          <p className="text-gray-400">
            Total: {ads.length} | Showing: {filteredAds.length} | Selected: {selectedAds.size}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={exportAds} 
            disabled={filteredAds.length === 0}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" /> 
            Export CSV
          </Button>

          <Button 
            onClick={fetchAds} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                  onClick={() => setSelectedAds(new Set())}
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
              {filteredAds.map((ad, index) => (
                <div key={ad.id} className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors">
                  <Checkbox 
                    checked={selectedAds.has(ad.id)} 
                    onCheckedChange={(checked) => handleSelectAd(ad.id, checked as boolean)} 
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
                              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0zMiAzNk0yNCAyOEgzMk0zMiAyOFY0ME00MCAyOEgzMk0zMiAyOFYxNiIgc3Ryb2tlPSIjOEU5M0FCIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cg=='
                            }}
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      {/* Ad Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white text-lg truncate">
                            {ad.title}
                          </h3>
                          {getStatusBadge(ad.status)}
                          <Badge variant="outline" className="text-green-400 border-green-600">
                            ${ad.price}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center gap-1 text-gray-300">
                            <User className="w-3 h-3" />
                            <span className="truncate">{ad.user?.email || 'Unknown User'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-300">
                            <Tag className="w-3 h-3" />
                            <span>{ad.category}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-300">
                            <MapPin className="w-3 h-3" />
                            <span>{ad.location || 'No location'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-300">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                          {ad.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewAdOnSite(ad.id)}
                      className="bg-transparent border-gray-600 text-green-400 hover:bg-green-900 hover:text-green-300"
                      title="View on site"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-600"
                          disabled={actionLoading === ad.id}
                        >
                          {actionLoading === ad.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 w-64">
                        <DropdownMenuLabel className="text-white">Admin Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-600" />

                        <DropdownMenuItem 
                          onClick={() => handleViewAdDetails(ad)}
                          className="text-blue-400 hover:bg-blue-900 hover:text-blue-300 cursor-pointer"
                        >
                          <FileText className="w-4 h-4 mr-2" /> 
                          View Full Details
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-gray-600" />
                        <DropdownMenuLabel className="text-gray-400 text-xs">Change Status</DropdownMenuLabel>

                        {getStatusOptions(ad.status).map(status => (
                          <DropdownMenuItem 
                            key={status}
                            onClick={() => setStatusChangeDialog({ ad, newStatus: status })}
                            className="text-green-400 hover:bg-green-900 hover:text-green-300 cursor-pointer"
                          >
                            {getStatusIcon(status)}
                            Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                          </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator className="bg-gray-600" />
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={!!statusChangeDialog} onOpenChange={() => setStatusChangeDialog(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Change Ad Status</DialogTitle>
          </DialogHeader>
          <div className="text-gray-400">
            Change status of "<strong className="text-white">{statusChangeDialog?.ad.title}</strong>" to{" "}
            <strong className="text-white">{statusChangeDialog?.newStatus}</strong>?
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStatusChangeDialog(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (statusChangeDialog) {
                  handleStatusChange(statusChangeDialog.ad.id, statusChangeDialog.newStatus)
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
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
