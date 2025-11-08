// components/superadmin/pending-review.tsx
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface PendingAd {
  id: string
  title: string
  description: string
  price: number
  category: string
  created_at: string
  user_id: string
  user_email: string
  images: string[]
}

export function PendingReview() {
  const [ads, setAds] = useState<PendingAd[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPendingAds()
  }, [])

  const fetchPendingAds = async () => {
    try {
      setLoading(true)
      const supabase = await getSupabaseClient()
      
      // Fetch products where status is 'pending'
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          description,
          price,
          category,
          created_at,
          user_id,
          profiles:user_id (email),
          images 
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const pendingAds: PendingAd[] = (data || []).map(ad => ({
        ...ad,
        user_email: ad.profiles?.email || 'Unknown User',
        images: ad.images || [],
        price: ad.price || 0,
        category: ad.category || 'N/A'
      })) as PendingAd[]
      
      setAds(pendingAds)

    } catch (error) {
      console.error('Error fetching pending ads:', error)
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // CORE FUNCTIONALITY: UPDATE AD STATUS FOR REVIEW
  // ==========================================================
  const updateAdStatus = async (id: string, status: 'active' | 'rejected') => {
    try {
      const supabase = await getSupabaseClient()
      
      const { error } = await supabase
        .from('products')
        .update({ status: status })
        .eq('id', id)
        
      if (error) throw error
      
      // Remove the ad from the pending list in the UI
      setAds(prevAds => prevAds.filter(ad => ad.id !== id))
      alert(`Ad ${id} ${status === 'active' ? 'approved' : 'rejected'} successfully.`)

    } catch (error) {
      console.error(`Error updating ad status to ${status}:`, error)
      alert(`Failed to ${status === 'active' ? 'approve' : 'reject'} ad.`)
    }
  }

  const approveAd = (id: string) => updateAdStatus(id, 'active')
  const rejectAd = (id: string) => updateAdStatus(id, 'rejected')

  const filteredAds = ads.filter(ad => 
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Pending Review ({ads.length})</h1>

      <Card className="p-4 bg-gray-800 border-gray-700 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800 border-gray-700 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" /> 
          Ads Awaiting Action
        </h2>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading pending ads...</div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400">No ads are currently pending review. Great job!</p>
            </div>
          ) : (
            filteredAds.map((ad) => (
              <Card key={ad.id} className="p-4 bg-gray-700 border-gray-600 shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white">{ad.title}</h3>
                    <p className="text-sm text-gray-400">
                      By: {ad.user_email} | Category: {ad.category} | Price: ${ad.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Posted: {new Date(ad.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => approveAd(ad.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => rejectAd(ad.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">{ad.description}</p>
                {ad.images && ad.images.length > 0 && (
                  <div className="flex gap-2">
                    {ad.images.slice(0, 3).map((img, index) => (
                      // Note: You must ensure 'img' is a full, accessible URL (e.g., Supabase Storage URL)
                      <img
                        key={index}
                        src={img}
                        alt={`${ad.title} image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
