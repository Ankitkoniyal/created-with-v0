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
      const supabase = await getSupabaseClient()
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

      const formattedAds = data.map(ad => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        category: ad.category,
        created_at: ad.created_at,
        user_id: ad.user_id,
        user_email: ad.profiles?.email || 'Unknown',
        images: ad.images || []
      }))

      setAds(formattedAds)
    } catch (error) {
      console.error("Error fetching pending ads:", error)
    } finally {
      setLoading(false)
    }
  }

  const approveAd = async (adId: string) => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase
        .from('products')
        .update({ status: 'active' })
        .eq('id', adId)

      if (error) throw error
      
      setAds(ads.filter(ad => ad.id !== adId))
    } catch (error) {
      console.error("Error approving ad:", error)
    }
  }

  const rejectAd = async (adId: string) => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase
        .from('products')
        .update({ status: 'rejected' })
        .eq('id', adId)

      if (error) throw error
      
      setAds(ads.filter(ad => ad.id !== adId))
    } catch (error) {
      console.error("Error rejecting ad:", error)
    }
  }

  const filteredAds = ads.filter(ad =>
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Review</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Pending Review</h1>
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          {ads.length} ads waiting review
        </Badge>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search pending ads..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="space-y-4">
          {filteredAds.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending ads for review</p>
            </div>
          ) : (
            filteredAds.map((ad) => (
              <Card key={ad.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{ad.title}</h3>
                    <p className="text-gray-600">₹{ad.price}</p>
                    <p className="text-sm text-gray-500">Category: {ad.category}</p>
                    <p className="text-sm text-gray-500">Posted by: {ad.user_email}</p>
                    <p className="text-sm text-gray-500">
                      Posted on: {new Date(ad.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                <p className="text-gray-700 mb-4">{ad.description}</p>
                {ad.images && ad.images.length > 0 && (
                  <div className="flex gap-2">
                    {ad.images.slice(0, 3).map((img, index) => (
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