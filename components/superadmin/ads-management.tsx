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
  ExternalLink,
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
  status: 'active' | 'sold' | 'expired' | 'pending' | 'rejected' | 'deleted' | 'inactive'
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

interface StatusChangeDialog {
  ad: Product
  newStatus: Product['status']
}

interface BulkAction {
  type: 'delete' | 'status'
  status?: Product['status']
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
  const [statusChangeDialog, setStatusChangeDialog] = useState<StatusChangeDialog | null>(null)
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set())
  const [bulkActionDialog, setBulkActionDialog] = useState<BulkAction | null>(null)
  const [debugInfo, setDebugInfo] = useState("")

  const { isAdmin, user: currentUser } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Redirect non-admins
  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.push("/")
    }
  }, [currentUser, isAdmin, router])

  // Fetch ads on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchAds()
    }
  }, [isAdmin])

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true)
      setDebugInfo("Starting to fetch ads...")
      
      console.log("🔄 Fetching ads from Supabase...")
      
      // First, let's test if we can connect to the products table
      const { data: testData, error: testError } = await supabase
        .from('products')
        .select('id')
        .limit(1)

      if (testError) {
        console.error("❌ Database connection failed:", testError)
        setDebugInfo(`Database error: ${testError.message}`)
        toast.error(`Database connection failed: ${testError.message}`)
        setAds([])
        return
      }

      console.log("✅ Database connection successful")

      // Fetch all ads with proper error handling
      const { data: adsData, error: adsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (adsError) {
        console.error("❌ Error fetching ads:", adsError)
        setDebugInfo(`Fetch error: ${adsError.message}`)
        toast.error(`Failed to load ads: ${adsError.message}`)
        setAds([])
        return
      }

      console.log("📊 Raw ads data from Supabase:", adsData)
      console.log(`✅ Found ${adsData?.length || 0} ads in database`)
      setDebugInfo(`Found ${adsData?.length || 0} ads in database`)

      if (adsData && adsData.length > 0) {
        console.log("🎯 First ad sample:", adsData[0])
        
        // Get user data for all ads
        const userIds = [...new Set(adsData.map(ad => ad.user_id).filter(Boolean))]
        console.log(`👤 User IDs found:`, userIds)
        
        let userMap = {}
        if (userIds.length > 0) {
          try {
            const { data: usersData, error: usersError } = await supabase
              .from('profiles')
              .select('id, email, full_name, phone')
              .in('id', userIds)

            if (usersError) {
              console.warn("⚠️ User data fetch failed:", usersError)
            } else {
              console.log("✅ User data fetched:", usersData)
              userMap = usersData?.reduce((acc, user) => {
                acc[user.id] = user
                return acc
              }, {} as Record<string, any>) || {}
            }
          } catch (userError) {
            console.warn("⚠️ User fetch error:", userError)
          }
        }

        // Combine data
        const adsWithUsers = adsData.map(ad => ({
          ...ad,
          user: userMap[ad.user_id] || { email: 'Unknown User' }
        }))

        console.log("🎉 Final ads data:", adsWithUsers)
        setAds(adsWithUsers as Product[])
        setDebugInfo(`Successfully loaded ${adsWithUsers.length} ads`)
        toast.success(`Loaded ${adsWithUsers.length} ads successfully`)
      } else {
        console.log("ℹ️ No ads found in database")
        setAds([])
        setDebugInfo("No ads found in database")
        toast.info("No ads found in the database")
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      setDebugInfo(`Unexpected error: ${error}`)
      toast.error('Unexpected error loading ads')
      setAds([])
    } finally {
      setLoading(false)
      console.log("🏁 Fetch completed, loading set to false")
    }
  }, [supabase])

  // Debug function to test connection
  const debugConnection = async () => {
    console.log("🔍 DEBUG: Testing Supabase connection...")
    
    // Test products table
    const { data: products, error: productsError, count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
    
    console.log("📊 Products count:", productsCount)
    console.log("📊 Products data:", products)
    console.log("❌ Products error:", productsError)
    
    toast.info(`Found ${productsCount || 0} products in database. Check console for details.`)
  }

  const sendNotification = async (userId: string, title: string, message: string, type: string) => {
    try {
      console.log("📨 Sending notification to user:", userId)
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          is_read: false,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error("❌ Notification error:", error)
        throw error
      }
      
      console.log("✅ Notification sent successfully")
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }

  const handleStatusChange = async (adId: string, newStatus: Product['status'], adTitle: string, userId: string) => {
    setActionLoading(adId)
    
    try {
      console.log(`🔄 Changing ad ${adId} status to:`, newStatus)
      
      const { data, error } = await supabase
        .from('products')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', adId)

      if (error) {
        console.error("❌ Status update error:", error)
        toast.error(`Database error: ${error.message}`)
        return
      }

      console.log("✅ Status updated successfully")

      // Send notification to ad owner
      const statusMessages = {
        active: "has been approved and is now live on CoinMint",
        pending: "is pending review by our team", 
        inactive: "has been paused and is not visible to users",
        rejected: "has been rejected. Please check our guidelines",
        expired: "has expired and is no longer visible",
        sold: "has been marked as sold",
        deleted: "has been deleted by admin"
      }

      await sendNotification(
        userId,
        `Ad Status Updated: ${adTitle}`,
        `Your ad "${adTitle}" ${statusMessages[newStatus]}`,
        'ad_status'
      )

      // Update local state
      setAds(prev => prev.map(ad => 
        ad.id === adId ? { ...ad, status: newStatus } : ad
      ))

      toast.success(`✅ Ad status updated to ${newStatus}`)
      setStatusChangeDialog(null)

    } catch (error) {
      console.error('❌ Error updating ad status:', error)
      toast.error('❌ Failed to update ad status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAd = async (adId: string, adTitle: string, userId: string) => {
    setActionLoading(adId)
    
    try {
      console.log(`🗑️ Deleting ad:`, adId)
      
      const adToDelete = ads.find(ad => ad.id === adId)
      
      if (adToDelete) {
        // Try to archive to deleted_ads if table exists
        try {
          const { error: archiveError } = await supabase
            .from('deleted_ads')
            .insert({
              original_id: adToDelete.id,
              title: adToDelete.title,
              description: adToDelete.description,
              price: adToDelete.price,
              category: adToDelete.category,
              location: adToDelete.location,
              status: 'deleted',
              views: adToDelete.views,
              user_id: adToDelete.user_id,
              images: adToDelete.images,
              original_created_at: adToDelete.created_at,
              deleted_at: new Date().toISOString(),
              deleted_by: currentUser?.id,
              reason: 'Admin deletion'
            })

          if (archiveError) {
            console.warn("⚠️ Archive failed, continuing with delete:", archiveError)
          } else {
            console.log("✅ Ad archived successfully")
          }
        } catch (archiveError) {
          console.warn("⚠️ Archive table might not exist, continuing with delete")
        }

        // Delete from main products table
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', adId)

        if (deleteError) {
          console.error("❌ Delete error:", deleteError)
          throw deleteError
        }

        console.log("✅ Ad deleted from products")

        // Send notification
        await sendNotification(
          userId,
          'Ad Deleted',
          `Your ad "${adTitle}" has been deleted by admin. Contact support for more information.`,
          'ad_deleted'
        )

        // Update local state and selected ads
        setAds(prev => prev.filter(ad => ad.id !== adId))
        setSelectedAds(prev => {
          const newSelected = new Set(prev)
          newSelected.delete(adId)
          return newSelected
        })
        
        toast.success('✅ Ad deleted successfully')
      }

      setDeleteDialog(null)

    } catch (error) {
      console.error('❌ Error deleting ad:', error)
      toast.error('❌ Failed to delete ad')
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

  // Bulk actions
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

  const handleBulkStatusChange = async (newStatus: Product['status']) => {
    if (selectedAds.size === 0) return

    setActionLoading('bulk')
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedAds))

      if (error) throw error

      // Send notifications and update local state
      const adsToUpdate = ads.filter(ad => selectedAds.has(ad.id))
      
      for (const ad of adsToUpdate) {
        await sendNotification(
          ad.user_id,
          `Ad Status Updated: ${ad.title}`,
          `Your ad "${ad.title}" status has been updated to ${newStatus}`,
          'ad_status'
        )
      }

      // Update local state
      setAds(prev => prev.map(ad => 
        selectedAds.has(ad.id) ? { ...ad, status: newStatus } : ad
      ))

      toast.success(`✅ ${selectedAds.size} ads updated to ${newStatus}`)
      setSelectedAds(new Set())
      setBulkActionDialog(null)

    } catch (error) {
      console.error('❌ Bulk status update error:', error)
      toast.error('❌ Failed to update ads')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedAds.size === 0) return

    setActionLoading('bulk-delete')
    
    try {
      const adsToDelete = ads.filter(ad => selectedAds.has(ad.id))
      
      // Delete from database
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', Array.from(selectedAds))

      if (error) throw error

      // Send notifications
      for (const ad of adsToDelete) {
        await sendNotification(
          ad.user_id,
          'Ad Deleted',
          `Your ad "${ad.title}" has been deleted by admin.`,
          'ad_deleted'
        )
      }

      // Update local state
      setAds(prev => prev.filter(ad => !selectedAds.has(ad.id)))
      setSelectedAds(new Set())
      
      toast.success(`✅ ${selectedAds.size} ads deleted successfully`)
      setBulkActionDialog(null)

    } catch (error) {
      console.error('❌ Bulk delete error:', error)
      toast.error('❌ Failed to delete ads')
    } finally {
      setActionLoading(null)
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
      
      toast.success('✅ Ads exported successfully')
    } catch (error) {
      console.error('❌ Error exporting ads:', error)
      toast.error('❌ Failed to export ads')
    }
  }

  const filteredAds = useMemo(() => {
    console.log("🔍 Filtering ads...", { 
      totalAds: ads.length, 
      searchQuery, 
      statusFilter 
    })
    
    const filtered = ads.filter(ad => {
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
    
    console.log("✅ Filtered ads count:", filtered.length)
    return filtered
  }, [ads, searchQuery, statusFilter])

  const getStatusBadge = (status: Product['status']) => {
    const variants = {
      active: { class: "bg-green-600", label: "Active" },
      pending: { class: "bg-yellow-600", label: "Pending" },
      rejected: { class: "bg-red-600", label: "Rejected" },
      sold: { class: "bg-blue-600", label: "Sold" },
      expired: { class: "bg-gray-600", label: "Expired" },
      inactive: { class: "bg-orange-600", label: "Inactive" },
      deleted: { class: "bg-red-800", label: "Deleted" }
    }
    
    return (
      <Badge className={variants[status].class}>
        {variants[status].label}
      </Badge>
    )
  }

  const getStatusOptions = (currentStatus: Product['status']) => {
    const allStatuses: Product['status'][] = ['active', 'pending', 'inactive', 'rejected', 'sold', 'expired']
    return allStatuses.filter(status => status !== currentStatus)
  }

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
    return <IconComponent className="w-4 h-4 mr-2" />
  }

  // Don't render if not admin
  if (currentUser && !isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Ads Management</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400">Loading...</p>
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
            {debugInfo && <span className="ml-2 text-yellow-400 text-sm">| {debugInfo}</span>}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={debugConnection}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Debug Connection
          </Button>
          
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

      {/* Bulk Actions */}
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
                      <Send className="w-4 h-4 mr-2" />
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem onClick={() => setBulkActionDialog({ type: 'status', status: 'active' })}>
                      {getStatusIcon('active')}
                      Mark as Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBulkActionDialog({ type: 'status', status: 'pending' })}>
                      {getStatusIcon('pending')}
                      Mark as Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBulkActionDialog({ type: 'status', status: 'inactive' })}>
                      {getStatusIcon('inactive')}
                      Mark as Inactive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBulkActionDialog({ type: 'status', status: 'rejected' })}>
                      {getStatusIcon('rejected')}
                      Mark as Rejected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBulkActionDialog({ type: 'status', status: 'sold' })}>
                      {getStatusIcon('sold')}
                      Mark as Sold
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setBulkActionDialog({ type: 'delete' })}
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
                placeholder="Search by ID, title, description, category, location..."
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
              <Button 
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                }}
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

                  {/* Action Buttons - SEPARATE Eye and Dropdown */}
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

                    {/* Dropdown Menu - All Other Actions */}
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
                            {getStatusIcon(status)}
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
            <DialogTitle className="text-green-500 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Change Ad Status
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to change the status of 
              <strong className="text-white"> "{statusChangeDialog?.ad.title}" </strong>
              to <strong className="text-white">{statusChangeDialog?.newStatus}</strong>?
              The ad owner will be notified of this change.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusChangeDialog(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={actionLoading === statusChangeDialog?.ad.id}
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
              Are you sure you want to delete <strong className="text-white">{deleteDialog?.title}</strong>?
              This will:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Remove the ad from CoinMint</li>
                <li>Notify the ad owner</li>
                <li>This action cannot be undone</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={actionLoading === deleteDialog?.id}
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

      {/* Bulk Action Dialogs */}
      <Dialog open={!!bulkActionDialog} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">
              {bulkActionDialog?.type === 'delete' ? 'Confirm Bulk Delete' : 'Confirm Bulk Status Change'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {bulkActionDialog?.type === 'delete' ? (
                <>
                  Are you sure you want to delete <strong>{selectedAds.size}</strong> ads?
                  This will remove all selected ads and notify their owners.
                </>
              ) : (
                <>
                  Are you sure you want to change the status of <strong>{selectedAds.size}</strong> ads to{' '}
                  <strong>{bulkActionDialog?.status}</strong>?
                  All ad owners will be notified of this change.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkActionDialog(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={actionLoading === 'bulk' || actionLoading === 'bulk-delete'}
            >
              Cancel
            </Button>
            <Button
              className={bulkActionDialog?.type === 'delete' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              onClick={() => {
                if (bulkActionDialog?.type === 'delete') {
                  handleBulkDelete()
                } else if (bulkActionDialog?.type === 'status' && bulkActionDialog.status) {
                  handleBulkStatusChange(bulkActionDialog.status)
                }
              }}
              disabled={actionLoading === 'bulk' || actionLoading === 'bulk-delete'}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : bulkActionDialog?.type === 'delete' ? (
                <Trash2 className="w-4 h-4 mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {actionLoading ? 'Processing...' : 'Confirm'}
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
                <div className="col-span-2">
                  <label className="text-sm text-gray-400">Ad ID</label>
                  <p className="text-white font-mono text-sm">{selectedAd.id}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-400">Created</label>
                  <p className="text-white">{new Date(selectedAd.created_at).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
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
