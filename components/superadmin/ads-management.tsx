"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  XCircle,
  CheckCircle,
  DollarSign,
  Download,
  RefreshCw,
  Ban,
  User,
  AlertTriangle,
  FileText // Added for no-results icon
} from "lucide-react"
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog" // Added Dialog components
import { createClient } from "@/lib/supabase/client"

// Updated Ad Interface: Added 'deleted' status
interface Ad {
  id: string
  title: string
  description: string
  price: number
  category: string
  location: string
  status: 'active' | 'inactive' | 'sold' | 'rejected' | 'pending' | 'deleted' // ADDED 'deleted'
  created_at: string
  user_email: string
  user_id: string
  images: string[]
  views: number
}

export function AdsManagement() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedAds, setSelectedAds] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  // --- SOFT DELETE STATES ---
  const [deleteConfirm, setDeleteConfirm] = useState<{ adId: string, adTitle: string } | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAds()
    fetchCategories()
  }, [])

  const fetchAds = async () => {
    setError(null);
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Fetch all products
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error

      if (!products || products.length === 0) {
        setAds([])
        return
      }

      // Filter out soft-deleted ads for the main management view
      const activeProducts = products.filter(ad => ad.status !== 'deleted'); 

      // Get unique user IDs
      const userIds = [...new Set(activeProducts.map(ad => ad.user_id))]

      // Fetch user emails
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)

      if (profilesError) throw profilesError

      // Create email map
      const emailMap = new Map()
      profiles?.forEach(profile => {
        emailMap.set(profile.id, profile.email)
      })

      // Combine data
      const adsWithEmails: Ad[] = activeProducts.map(ad => ({
        ...ad,
        user_email: emailMap.get(ad.user_id) || 'Unknown',
        images: ad.images || [],
        views: ad.views || 0,
        status: ad.status as Ad['status'] // Type assertion for safety
      }))

      setAds(adsWithEmails)
    } catch (error) {
      console.error("Error fetching ads:", error)
      setError("Failed to load ads. Please check your Supabase connection.")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name')

      if (!error && data) {
        setCategories(data.map(cat => cat.name))
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  // Auto-save Status Update
  const updateAdStatus = async (adId: string, status: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .update({ status })
        .eq('id', adId)

      if (error) throw error

      // Update local state immediately
      setAds(ads.map(ad => 
        ad.id === adId ? { ...ad, status: status as Ad['status'] } : ad
      ))
    } catch (error) {
      console.error("Error updating ad status:", error)
      setError(`Failed to update status for ad ${adId}.`)
    }
  }

  // --- SOFT DELETE IMPLEMENTATION (Replaces hard deleteAd) ---
  const softDeleteAd = async () => {
    if (!deleteConfirm || !deleteReason.trim()) {
        setError("Deletion reason is mandatory for soft delete logging.");
        return;
    }

    const { adId } = deleteConfirm
    setIsDeleting(true);
    setError(null);

    try {
      const supabase = createClient()
      
      // 1. ARCHIVE: Log the ad to the separate monitoring table
      // IMPORTANT: You MUST create a 'deleted_ads_log' table in Supabase 
      // before uncommenting this block to enable full monitoring.
      /*
      const { error: logError } = await supabase
         .from('deleted_ads_log')
         .insert({ 
           product_id: adId, 
           deletion_reason: deleteReason, 
           deleted_by_admin_id: 'CURRENT_ADMIN_ID_HERE', // <-- Replace with actual admin's ID
           deleted_at: new Date().toISOString()
         });
      
      if (logError) throw logError;
      */
      
      // 2. SOFT DELETE: Update status in the main 'products' table to 'deleted'
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
            status: 'deleted' as Ad['status'] 
        })
        .eq('id', adId)
        .limit(1)

      if (updateError) throw updateError

      // Remove from local state and close the dialog
      setAds(ads.filter(ad => ad.id !== adId))
      setDeleteConfirm(null)
      setDeleteReason("")
      setSelectedAds(selectedAds.filter(id => id !== adId)) // Also deselect if it was selected

    } catch (error) {
      console.error("Error soft-deleting ad:", error)
      setError("Soft delete failed. Check logs and ensure 'deleted_ads_log' table is structured correctly.")
    } finally {
      setIsDeleting(false);
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAds(filteredAds.map(ad => ad.id))
    } else {
      setSelectedAds([])
    }
  }

  const handleSelectAd = (adId: string, checked: boolean) => {
    if (checked) {
      setSelectedAds([...selectedAds, adId])
    } else {
      setSelectedAds(selectedAds.filter(id => id !== adId))
    }
  }
  
  // Placeholder for Eye Icon functionality
  const handleViewAd = (adId: string) => {
      // Implement your navigation logic here (e.g., using Next.js router)
      // router.push(`/superadmin/ad-details/${adId}`);
      console.log(`Viewing details for ad: ${adId}`);
      alert(`Viewing Ad Details for ID: ${adId}. Integrate router navigation here.`);
  }

  const bulkUpdateStatus = async (status: string) => {
     // ... (Bulk update logic remains the same)
    if (selectedAds.length === 0) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .update({ status })
        .in('id', selectedAds)

      if (error) throw error

      // Update local state
      setAds(ads.map(ad => 
        selectedAds.includes(ad.id) ? { ...ad, status: status as Ad['status'] } : ad
      ))
      
      setSelectedAds([])
    } catch (error) {
      console.error("Error bulk updating ads:", error)
      setError("Bulk update failed.")
    }
  }

  const bulkDeleteAds = async () => {
    if (selectedAds.length === 0) return
    
    // For simplicity in a bulk action, we can use the soft delete status update.
    if (!confirm(`Are you sure you want to SOFT DELETE ${selectedAds.length} ads? They will be marked as 'deleted' and removed from the site.`)) {
      return
    }

    try {
      const supabase = createClient()
      
      // Bulk Soft Delete: Update status to 'deleted'
      const { error } = await supabase
        .from('products')
        .update({ status: 'deleted' as Ad['status'] })
        .in('id', selectedAds)

      if (error) throw error

      // Remove from local state
      setAds(ads.filter(ad => !selectedAds.includes(ad.id)))
      setSelectedAds([])
    } catch (error) {
      console.error("Error bulk deleting ads:", error)
      setError("Bulk soft delete failed.")
    }
  }
  
  const exportAds = () => {
    const csvContent = [
      ['ID', 'Title', 'Price', 'Category', 'Status', 'User Email', 'Created Date'], // Removed Location and Views
      ...filteredAds.map(ad => [
        ad.id,
        `"${ad.title.replace(/"/g, '""')}"`,
        ad.price,
        ad.category,
        ad.status,
        ad.user_email,
        new Date(ad.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ads-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900 text-green-400 border-green-700'
      case 'pending': return 'bg-yellow-900 text-yellow-400 border-yellow-700'
      case 'rejected': return 'bg-red-900 text-red-400 border-red-700'
      case 'sold': return 'bg-blue-900 text-blue-400 border-blue-700'
      case 'inactive': return 'bg-gray-700 text-gray-400 border-gray-600'
      case 'deleted': return 'bg-red-950 text-red-700 border-red-900' // Should not be seen in this view
      default: return 'bg-gray-700 text-gray-400 border-gray-600'
    }
  }

  const filteredAds = ads.filter(ad =>
    (ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ad.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ad.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ad.id.toLowerCase().includes(searchTerm.toLowerCase())) && // Added ID search
    (statusFilter === "all" || ad.status === statusFilter) &&
    (categoryFilter === "all" || ad.category === categoryFilter)
  )

  if (loading) {
     // ... (loading component remains the same)
    return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-64 bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-48 bg-gray-700 rounded animate-pulse" />
          </div>
          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="grid gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </Card>
        </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Ads Management</h1>
          <p className="text-gray-400">
            {filteredAds.length} of {ads.length} active ads shown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={exportAds}
            variant="outline"
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={fetchAds}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
            <div className="p-3 text-sm text-red-500 bg-red-900/20 border border-red-900 rounded-lg">
                <AlertTriangle className="w-4 h-4 mr-2 inline" /> {error}
            </div>
        )}

      {/* Bulk Actions */}
      {selectedAds.length > 0 && (
        <Card className="p-4 bg-blue-900 border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">
                {selectedAds.length} ads selected
              </span>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => bulkUpdateStatus('active')}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => bulkUpdateStatus('rejected')}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-gray-600 hover:bg-gray-700 text-white"
                onClick={() => bulkUpdateStatus('inactive')}
              >
                <Ban className="w-4 h-4 mr-1" />
                Deactivate
              </Button>
              <Button
                size="sm"
                className="bg-red-800 hover:bg-red-900 text-white"
                onClick={bulkDeleteAds} // Bulk soft delete implemented
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Soft Delete
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => setSelectedAds([])}
            >
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      {/* Filters & Table */}
      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search title, description, ID, or user email..."
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="sold">Sold</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 text-gray-400 w-12">
                  <Checkbox
                    checked={selectedAds.length === filteredAds.length && filteredAds.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="text-left py-3 text-gray-400">Ad Details</th>
                <th className="text-left py-3 text-gray-400">Price</th>
                <th className="text-left py-3 text-gray-400">Category</th>
                <th className="text-left py-3 text-gray-400">Posted By</th>
                <th className="text-left py-3 text-gray-400">Status</th>
                <th className="text-left py-3 text-gray-400 w-20">Date</th>
                <th className="text-left py-3 text-gray-400 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.map((ad) => (
                <tr key={ad.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                  <td className="py-4">
                    <Checkbox
                      checked={selectedAds.includes(ad.id)}
                      onCheckedChange={(checked) => handleSelectAd(ad.id, checked as boolean)}
                    />
                  </td>
                  
                  {/* Smartly Arranged Ad Details (ID + Title/Description) */}
                  <td className="py-4 max-w-xs">
                    <div className="flex flex-col">
                        <span className="font-mono text-xs text-gray-500 mb-1">
                            ID: **{ad.id.slice(-6).toUpperCase()}**
                        </span>
                        <p className="font-medium text-white truncate">{ad.title}</p>
                        <p className="text-sm text-gray-400 line-clamp-1">{ad.description}</p>
                    </div>
                  </td>

                  <td className="py-4">
                    <div className="flex items-center text-white text-sm">
                      <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                      {ad.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                      {ad.category}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-white text-sm max-w-[120px] truncate">{ad.user_email}</span>
                    </div>
                  </td>
                  
                  {/* Improved Status Dropdown (Auto-Save) */}
                  <td className="py-4">
                    <select
                      value={ad.status}
                      onChange={(e) => updateAdStatus(ad.id, e.target.value)}
                      className={`px-2 py-1 text-sm border rounded text-white ${getStatusColor(ad.status)}`}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                      <option value="sold">Sold</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  
                  <td className="py-4 text-white text-sm">
                    {new Date(ad.created_at).toLocaleDateString()}
                  </td>
                  
                  {/* Actions */}
                  <td className="py-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-blue-900 border-blue-700 text-blue-400 hover:bg-blue-800"
                        onClick={() => handleViewAd(ad.id)} // Eye Icon Fix
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-red-900 border-red-700 text-red-400 hover:bg-red-800"
                        onClick={() => setDeleteConfirm({ adId: ad.id, adTitle: ad.title })} // Soft Delete Dialog Trigger
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAds.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg mb-2">No ads found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </Card>

      {/* --- SOFT DELETE CONFIRMATION DIALOG --- */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => { setDeleteConfirm(null); setDeleteReason(""); }}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">Confirm Soft Delete</DialogTitle>
            <DialogDescription className="text-gray-400">
              You are soft-deleting the ad: <strong className="text-white">{deleteConfirm?.adTitle}</strong>. 
              This action sets the ad's status to 'deleted', removing it from the public site. 
              The database record will remain for auditing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <label htmlFor="delete-reason" className="block text-sm font-medium text-gray-300">
              Remark / Reason for Deletion <span className="text-red-500">*</span>
            </label>
            <Input
              id="delete-reason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g., Policy Violation: Spam, Prohibited Item"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDeleteConfirm(null); setDeleteReason("") }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={softDeleteAd}
              disabled={!deleteReason.trim() || isDeleting}
            >
              {isDeleting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {isDeleting ? 'Processing...' : 'Confirm Soft Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
