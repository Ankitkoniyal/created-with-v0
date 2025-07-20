"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, User, Heart } from "lucide-react"
import type { Ad } from "@/lib/mock-data"
import { mockUsers } from "@/lib/mock-data"
import { useWishlist } from "@/components/wishlist-context"
import { toast } from "@/hooks/use-toast"

interface ImprovedAdCardProps {
  ad: Ad
}

export function ImprovedAdCard({ ad }: ImprovedAdCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const seller = mockUsers.find((user) => user.id === ad.user_id)
  const isWishlisted = isInWishlist(ad.id)

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isWishlisted) {
      removeFromWishlist(ad.id)
      toast({
        title: "Removed from Wishlist",
        description: "Item removed from your wishlist",
      })
    } else {
      addToWishlist(ad.id)
      toast({
        title: "Added to Wishlist",
        description: "Item added to your wishlist",
      })
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const formatCondition = (condition: string) => {
    switch (condition) {
      case "second_hand":
        return "Second Hand"
      case "like_new":
        return "Like New"
      case "new":
        return "New"
      default:
        return condition
    }
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 bg-white overflow-hidden">
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative">
          <Link href={`/ad/${ad.id}`}>
            <div className="aspect-[4/3] relative overflow-hidden">
              <Image
                src={ad.images?.[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop"}
                alt={ad.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Overlay badges */}
              <div className="absolute top-3 left-3">
                <Badge variant="outline" className="bg-white/95 backdrop-blur-sm text-xs font-mono border-0 shadow-sm">
                  {ad.adId}
                </Badge>
              </div>

              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {ad.condition && (
                  <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-0 text-xs font-medium">
                    {formatCondition(ad.condition)}
                  </Badge>
                )}
                {ad.negotiable && (
                  <Badge className="bg-blue-500/90 backdrop-blur-sm text-white border-0 text-xs font-medium">
                    Negotiable
                  </Badge>
                )}
              </div>

              {/* Wishlist button - Fixed to prevent navigation */}
              <Button
                size="sm"
                variant="ghost"
                className="absolute bottom-3 right-3 h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200"
                onClick={handleWishlistClick}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
            </div>
          </Link>
        </div>

        {/* Content Section - Improved alignment and spacing */}
        <div className="p-4 space-y-3">
          {/* Title and Price - Better alignment */}
          <div className="space-y-2">
            <Link href={`/ad/${ad.id}`}>
              <h3 className="font-semibold text-base leading-tight line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                {ad.title}
              </h3>
            </Link>

            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-blue-600">{formatPrice(ad.price)}</p>
              {ad.negotiable && <span className="text-xs text-gray-500 font-medium">Negotiable</span>}
            </div>
          </div>

          {/* Seller Info - Compact layout */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="font-medium truncate max-w-[100px]">{seller?.full_name || "Anonymous"}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              <span>★</span>
              <span className="text-gray-600">{seller?.rating || "4.0"}</span>
            </div>
          </div>

          {/* Location and Date - Compact layout */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[120px]">
                {ad.city}, {ad.state}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>{formatDate(ad.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
