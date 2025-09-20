// components/superadmin/ads-management.tsx
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
  DollarSign
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface Ad {
  id: string
  title: string
  description: string
  price: number
  category: string
  location: string
  status: 'active' | 'inactive' | 'sold' | 'rejected' | 'pending'
  created_at: string
  user_email: string
}

export function AdsManagement() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAds, setSelectedAds] = useState<string[]>([])

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      const supabase = await getSupabaseClient()
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Get user emails for each ad
      const adsWithEmails = await Promise.all(
        data.map(async (ad) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', ad.user_id)
            .single()

          return {
            ...ad,
            user_email: userData?.email || 'Unknown'
          }
        })
      )

      setAds(adsWithEmails)
    } catch (error) {
      console.error("Error fetching ads:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateAdStatus = async (adId: string, status: string) => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase
        .from('products')
        .update({ status })
        .eq('id', adId)

      if (error) throw error

      // Update local state
      setAds(ads.map(ad => 
        ad.id === adId ? { ...ad, status: status as any } : ad
      ))
    } catch (error) {
      console.error("Error updating ad status:", error)
    }
  }

  const deleteAd = async (adId: string) => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', adId)

      if (error) throw error

      // Remove from local state
      setAds(ads.filter(ad => ad.id !== adId))
    } catch (error) {
      console.error("Error deleting ad:", error)
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

  const bulkUpdateStatus = async (status: string) => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase
        .from('products')
        .update({ status })
        .in('id', selectedAds)

      if (error) throw error

      // Update local state
      setAds(ads.map(ad => 
        selectedAds.includes(ad.id) ? { ...ad, status: status as any } : ad
      ))
      
      setSelectedAds([])
    } catch (error) {
      console.error("Error bulk updating ads:", error)
    }
  }

  const bulkDeleteAds = async () => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedAds)

      if (error) throw error

      // Remove from local state
      setAds(ads.filter(ad => !selectedAds.includes(ad.id)))
      setSelectedAds([])
    } catch (error) {
      console.error("Error bulk deleting ads:", error)
    }
  }

  const filteredAds = ads.filter(ad =>
    (ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ad.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     ad.user_email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "all" || ad.status === statusFilter)
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Ads Management</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 bg-gray-800">
              <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Ads Management</h1>
        <Badge variant="outline" className="bg-green-900 text-green-400 border-green-700">
          {ads.length} total ads
        </Badge>
      </div>

      {/* Bulk Actions */}
      {selectedAds.length > 0 && (
        <Card className="p-4 bg-blue-900 border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white">{selectedAds.length} ads selected</span>
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
                Deactivate
              </Button>
              <Button
                size="sm"
                className="bg-red-800 hover:bg-red-900 text-white"
                onClick={bulkDeleteAds}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
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

      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search ads..."
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
                <th className="text-left py-3 text-gray-400">Ad Title</th>
                <th className="text-left py-3 text-gray-400">Price</th>
                <th className="text-left py-3 text-gray-400">Category</th>
                <th className="text-left py-3 text-gray-400">Posted By</th>
                <th className="text-left py-3 text-gray-400">Status</th>
                <th className="text-left py-3 text-gray-400">Date</th>
                <th className="text-left py-3 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.map((ad) => (
                <tr key={ad.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-4">
                    <Checkbox
                      checked={selectedAds.includes(ad.id)}
                      onCheckedChange={(checked) => handleSelectAd(ad.id, checked as boolean)}
                    />
                  </td>
                  <td className="py-4">
                    <p className="font-medium text-white">{ad.title}</p>
                    <p className="text-sm text-gray-400 line-clamp-1">{ad.description}</p>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center text-white">
                      <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                      {ad.price}
                    </div>
                  </td>
                  <td className="py-4 text-white">{ad.category}</td>
                  <td className="py-4 text-white">{ad.user_email}</td>
                  <td className="py-4">
                    <select
                      value={ad.status}
                      onChange={(e) => updateAdStatus(ad.id, e.target.value)}
                      className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                      <option value="sold">Sold</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="py-4 text-white">
                    {new Date(ad.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-red-900 border-red-700 text-white hover:bg-red-800"
                        onClick={() => deleteAd(ad.id)}
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
            <p className="text-gray-400">No ads found</p>
          </div>
        )}
      </Card>
    </div>
  )
}