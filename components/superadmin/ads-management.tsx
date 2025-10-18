"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
  Send,
  MoreVertical,
  ExternalLink
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
  DialogDescription,
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
  location: string
  status: string
  views: number
  created_at: string
  updated_at: string
  user_id: string
  images: string[]
  user?: {
    email: string
    full_name: string | null
    phone: string | null
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
  const [statusChangeDialog, setStatusChangeDialog] = useState<{ad: Product, newStatus: string} | null>(null)
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set())

  const { isAdmin } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      router.push("/")
    }
  }, [isAdmin, router])

  // Fetch ads on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchAds()
    }
  }, [isAdmin])

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching ads from Supabase...")

      // Fetch all ads
      const { data: adsData, error: adsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (adsError) {
        console.error("❌ Error fetching ads:", adsError)
        toast.error('Failed to load ads')
        return
      }

      console.log("✅ Ads fetched:", adsData?.length)

      if (adsData && adsData.length > 0) {
        // Get user data for the ads
        const userIds = [...new Set(adsData.map(ad => ad.user_id))]
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone')
          .in('id', userIds)

        const userMap = usersData?.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as Record<string, any>) || {}

        // Combine data
        const adsWithUsers = adsData.map(ad => ({
          ...ad,
          user: userMap[ad.user_id] || { email: 'Unknown User' }
        }))

        setAds(adsWithUsers)
        toast.success(`Loaded ${adsWithUsers.length} ads`)
      } else {
        setAds([])
        toast.info("No ads found")
      }
    } catch (error) {
      console.error('❌ Error fetching ads:', error)
      toast.error('Failed to load ads')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const sendNotification = async (userId: string, title: string, message: string) => {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type: 'admin_action',
          is_read: false,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  const handleStatusChange = async (adId: string, newStatus: string, adTitle: string, userId: string) => {
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

      // Send notification to ad owner
      await sendNotification(
        userId,
        `Ad Status Updated: ${adTitle}`,
        `Your ad "${adTitle}" has been ${newStatus}`
      )

      // Update local state
      setAds(prev => prev.map(ad => 
        ad.id === adId ? { ...ad, status: newStatus } : ad
      ))

      toast.success(`Ad status updated to ${newStatus}`)
      setStatusChangeDialog(null)

    } catch (error) {
      console.error('Error updating ad status:', error)
      toast.error('Failed to update ad status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAd = async (adId: string, adTitle: string, userId: string) => {
    setActionLoading(adId)
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', adId)

      if (error) throw error

      // Send notification
      await sendNotification(
        userId,
        'Ad Deleted',
        `Your ad "${adTitle}" has been deleted by admin`
      )

      // Update local state
      setAds(prev => prev.filter(ad => ad.id !== adId))
      setSelectedAds(prev => {
        const newSelected = new Set(prev)
        newSelected.delete(adId)
        return newSelected
      })
      
      toast.success('Ad deleted successfully')
      setDeleteDialog(null)

    } catch (error) {
      console.error('Error deleting ad:', error)
      toast.error('Failed to delete ad')
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewAdDetails = (ad: Product) => {
    setSelectedAd(ad)
    setAdDetailsOpen(true)
  }

  const handleViewAdOnSite = (adId: string) => {
    window.open(`/ads/${adId}`, '_blank')
  }

  const handleSelectAd = (adId: string, checked: boolean) => {
    setSelectedAds(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(adId)
      } else {
        newSelected.delete(adId)
      }
      return newSelected
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAds(new Set(filteredAds.map(ad => ad.id)))
    } else {
      setSelectedAds(new Set())
    }
  }

  const exportAds = async () => {
    try {
      const csvContent = [
        ['ID', 'Title', 'Price', 'Category', 'Location', 'Status', 'Views', 'User Email', 'Created Date'],
        ...filteredAds.map((ad) => [
          ad.id.slice(-6),
          `"${ad.title}"`,
          ad.price,
          ad.category,
          ad.location,
          ad.status,
          ad.views,
          ad.user?.email || 'Unknown',
          new Date(ad.created_at).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coinmint-ads-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('Ads exported successfully')
    } catch (error) {
      console.error('Error exporting ads:', error)
      toast.error('Failed to export ads')
    }
  }

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchesSearch = 
        ad.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ad.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || ad.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [ads, searchQuery, statusFilter])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-green-600",
      pending: "bg-yellow-600", 
      rejected: "bg-red-600",
      sold: "bg-blue-600",
      expired: "bg-gray-600",
      inactive: "bg-orange-600",
      deleted: "bg-red-800"
    }
    
    return (
      <Badge className={variants[status] || "bg-gray-600"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = ['active', 'pending', 'inactive', 'rejected', 'sold', 'expired']
    return allStatuses.filter(status => status !== currentStatus)
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Ads Management</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400">Unauthorized</p>
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
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
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

      {/* Ads Table */}
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
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-green-500" />
              <p className="text-gray-400 mt-2">Loading ads...</p>
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No ads found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
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

              {filteredAds.map((ad, index) => (
                <div
                  key={ad.id}
                  className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedAds.has(ad.id)}
                    onCheckedChange={(checked) => handleSelectAd(ad.id, checked as boolean)}
                  />
                  
                  {/* Number */}
                  <div className="flex items-center justify-center w-6 h-6 bg-gray-600 rounded text-xs text-gray-300 font-medium flex-shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex flex-1 items-start gap-4">
                    <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {ad.images && ad.images.length > 0 ? (
                        <img 
                          src={ad.images[0]} 
                          alt={ad.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white text-lg">
                          {ad.title}
                        </h3>
                        {getStatusBadge(ad.status)}
                        <Badge variant="outline" className="text-green-400 border-green-600">
                          ${ad.price}
                        </Badge>
                        <Badge variant="outline" className="text-gray-400 border-gray-600">
                          ID: {ad.id.slice(-6)}
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
                          <span>{ad.location}</span>
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

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Eye Icon - Direct Link */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewAdOnSite(ad.id)}
                      className="bg-transparent border-gray-600 text-green-400 hover:bg-green-900 hover:text-green-300"
                      title="View on CoinMint"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {/* Dropdown Menu */}
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
                        
                        {/* View Full Details */}
                        <DropdownMenuItem 
                          onClick={() => handleViewAdDetails(ad)}
                          className="text-blue-400 hover:bg-blue-900 hover:text-blue-300 cursor-pointer"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Full Details
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-gray-600" />
                        
                        {/* Status Change Options */}
                        <DropdownMenuLabel className="text-gray-400 text-xs">Change Status</DropdownMenuLabel>
                        {getStatusOptions(ad.status).map((status) => (
                          <DropdownMenuItem 
                            key={status}
                            onClick={() => setStatusChangeDialog({ ad, newStatus: status })}
                            className="text-green-400 hover:bg-green-900 hover:text-green-300 cursor-pointer"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                          </DropdownMenuItem>
                        ))}
                        
                        <DropdownMenuSeparator className="bg-gray-600" />
                        
                        {/* Delete Option */}
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
            <DialogTitle className="text-green-500">Change Ad Status</DialogTitle>
            <DialogDescription className="text-gray-400">
              Change status of "{statusChangeDialog?.ad.title}" to {statusChangeDialog?.newStatus}?
            </DialogDescription>
          </DialogHeader>
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
                  handleStatusChange(
                    statusChangeDialog.ad.id,
                    statusChangeDialog.newStatus,
                    statusChangeDialog.ad.title,
                    statusChangeDialog.ad.user_id
                  )
                }
              }}
              disabled={actionLoading === statusChangeDialog?.ad.id}
            >
              {actionLoading === statusChangeDialog?.ad.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {actionLoading === statusChangeDialog?.ad.id ? 'Updating...' : 'Change Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">Confirm Delete</DialogTitle>
            <DialogDescription className="text-gray-400">
              Delete "{deleteDialog?.title}" permanently?
            </DialogDescription>
          </DialogHeader>
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
                if (deleteDialog) {
                  handleDeleteAd(deleteDialog.id, deleteDialog.title, deleteDialog.user_id)
                }
              }}
              disabled={actionLoading === deleteDialog?.id}
            >
              {actionLoading === deleteDialog?.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {actionLoading === deleteDialog?.id ? 'Deleting...' : 'Delete Ad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ad Details Dialog */}
      <Dialog open={adDetailsOpen} onOpenChange={setAdDetailsOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Ad Details</DialogTitle>
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
                  <p className="text-white">{selectedAd.location}</p>
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
                  <p className="text-white mt-1">{selectedAd.description}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400">User</label>
                  <p className="text-white">{selectedAd.user?.email || 'Unknown'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
