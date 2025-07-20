"use client"

import { useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { ImprovedAdCard } from "@/components/improved-ad-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWishlist } from "@/components/wishlist-context"
import { getAllAds } from "@/lib/mock-data"
import { Heart, ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function WishlistPage() {
  const { ids: wishlistIds, removeFromWishlist } = useWishlist()

  const wishlistAds = useMemo(() => {
    const allAds = getAllAds()
    return allAds.filter((ad) => wishlistIds.includes(ad.id) && ad.status === "active")
  }, [wishlistIds])

  const handleClearWishlist = () => {
    wishlistIds.forEach((id) => removeFromWishlist(id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500" />
              My Wishlist
            </h1>
            <p className="text-gray-600 mt-1">{wishlistAds.length} items saved</p>
          </div>
          {wishlistAds.length > 0 && (
            <Button variant="outline" onClick={handleClearWishlist}>
              Clear All
            </Button>
          )}
        </div>

        {wishlistAds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistAds.map((ad) => (
              <ImprovedAdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-6 w-6" />
                Your wishlist is empty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Start adding items to your wishlist by clicking the heart icon on any ad.
              </p>
              <Button asChild>
                <Link href="/search">Browse Ads</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
