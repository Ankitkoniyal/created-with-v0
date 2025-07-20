"use client"

import { useMemo, useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { AdManagementCard } from "@/components/ad-management-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllAds, getAdsFromStorage, type Ad } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function MyAdsPage() {
  const { user } = useAuth()
  const [ads, setAds] = useState<Ad[]>([])
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "",
    negotiable: false,
  })

  useEffect(() => {
    const allAds = getAllAds()
    setAds(allAds)
  }, [])

  const userAds = useMemo(() => {
    if (!user) return []
    return ads.filter((ad) => ad.user_id === user.id)
  }, [user, ads])

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad)
    setEditFormData({
      title: ad.title,
      description: ad.description,
      price: ad.price?.toString() || "",
      condition: ad.condition,
      negotiable: ad.negotiable,
    })
  }

  const handleSaveEdit = () => {
    if (!editingAd) return

    const updatedAd: Ad = {
      ...editingAd,
      title: editFormData.title,
      description: editFormData.description,
      price: editFormData.price ? Number.parseFloat(editFormData.price) : null,
      condition: editFormData.condition as "new" | "second_hand" | "like_new",
      negotiable: editFormData.negotiable,
      updated_at: new Date().toISOString(),
    }

    // Update in localStorage
    const allAds = getAdsFromStorage()
    const updatedAds = allAds.map((ad) => (ad.id === editingAd.id ? updatedAd : ad))
    localStorage.setItem("marketplace_ads", JSON.stringify(updatedAds))

    // Update local state
    setAds(updatedAds)
    setEditingAd(null)

    toast({
      title: "Success",
      description: "Ad updated successfully!",
    })
  }

  const handleMarkAsSold = (adId: string) => {
    const allAds = getAdsFromStorage()
    const updatedAds = allAds.map((ad) =>
      ad.id === adId ? { ...ad, status: "sold" as const, updated_at: new Date().toISOString() } : ad,
    )
    localStorage.setItem("marketplace_ads", JSON.stringify(updatedAds))
    setAds(updatedAds)

    toast({
      title: "Success",
      description: "Ad marked as sold!",
    })
  }

  const handleDeleteAd = (adId: string) => {
    const allAds = getAdsFromStorage()
    const updatedAds = allAds.filter((ad) => ad.id !== adId)
    localStorage.setItem("marketplace_ads", JSON.stringify(updatedAds))
    setAds(updatedAds)

    toast({
      title: "Success",
      description: "Ad deleted successfully!",
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Please sign in to view your ads</h1>
        </div>
      </div>
    )
  }

  const activeAds = userAds.filter((ad) => ad.status === "active")
  const soldAds = userAds.filter((ad) => ad.status === "sold")

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Ads</h1>
            <p className="text-gray-600 mt-1">
              {activeAds.length} active, {soldAds.length} sold
            </p>
          </div>
          <Button asChild>
            <Link href="/post-ad">
              <Plus className="h-4 w-4 mr-2" />
              Post New Ad
            </Link>
          </Button>
        </div>

        {userAds.length > 0 ? (
          <div className="space-y-8">
            {/* Active Ads */}
            {activeAds.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  Active Ads
                  <Badge variant="secondary">{activeAds.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeAds.map((ad) => (
                    <AdManagementCard
                      key={ad.id}
                      ad={ad}
                      onEdit={handleEditAd}
                      onMarkAsSold={handleMarkAsSold}
                      onDelete={handleDeleteAd}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sold Ads */}
            {soldAds.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  Sold Ads
                  <Badge variant="outline">{soldAds.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {soldAds.map((ad) => (
                    <AdManagementCard
                      key={ad.id}
                      ad={ad}
                      onEdit={handleEditAd}
                      onMarkAsSold={handleMarkAsSold}
                      onDelete={handleDeleteAd}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No ads yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You haven't posted any ads yet. Start selling by posting your first ad!
              </p>
              <Button asChild>
                <Link href="/post-ad">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Ad
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Ad Dialog */}
        <Dialog open={!!editingAd} onOpenChange={() => setEditingAd(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Ad</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Price (₹)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-condition">Condition</Label>
                <Select
                  value={editFormData.condition}
                  onValueChange={(value) => setEditFormData({ ...editFormData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="second_hand">Second Hand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-negotiable"
                  checked={editFormData.negotiable}
                  onChange={(e) => setEditFormData({ ...editFormData, negotiable: e.target.checked })}
                />
                <Label htmlFor="edit-negotiable">Price is negotiable</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingAd(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
