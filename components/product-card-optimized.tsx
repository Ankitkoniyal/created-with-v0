// Optimized Product Card Component with React.memo
"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getOptimizedImageUrl } from "@/lib/images"
import { StarRating } from "@/components/ui/star-rating"
import { formatLocation } from "@/lib/location-utils"

interface ProductCardProps {
  product: {
    id: string
    title: string
    price: number
    price_type?: string
    images?: string[]
    city: string
    province: string
    created_at: string
    user_id: string
    sellerRating?: {
      average_rating: number
      total_ratings: number
    }
  }
  isFavorite: boolean
  onToggleFavorite: (productId: string, e?: React.MouseEvent) => void
  formatPrice: (price?: number, priceType?: string) => string
  isNegotiable: (priceType?: string) => boolean
  formatTimePosted: (createdAt?: string) => string
}

const ProductCard = React.memo<ProductCardProps>(({
  product,
  isFavorite,
  onToggleFavorite,
  formatPrice,
  isNegotiable,
  formatTimePosted,
}) => {
  const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
  const optimizedPrimary = getOptimizedImageUrl(primaryImage, "thumb") || primaryImage

  return (
    <Link href={`/product/${product.id}`} className="block" prefetch={false}>
      <Card className="h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-sm hover:shadow-md transition-shadow">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
            <Image
              src={optimizedPrimary || "/placeholder.svg"}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw"
              className="object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg"
              }}
            />
            
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleFavorite(product.id, e)
              }}
              className={`absolute top-1 right-1 p-1 rounded ${
                isFavorite 
                  ? "text-red-500 bg-white/90" 
                  : "text-gray-400 bg-white/80"
              }`}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart 
                className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`}
              />
            </button>
          </div>

          <div className="px-2 py-1 flex flex-col flex-1">
            <div className="mb-0">
              <span className="text-base font-bold text-green-700">
                {formatPrice(product.price, product.price_type)}
                {isNegotiable(product.price_type) && (
                  <span className="text-xs font-normal text-gray-600 ml-1">Negotiable</span>
                )}
              </span>
            </div>
              
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-0 leading-snug">
              {product.title}
            </h4>

            {/* Rating */}
            {product.sellerRating && product.sellerRating.average_rating > 0 && (
              <div className="mt-0.5 mb-0">
                <StarRating 
                  rating={product.sellerRating.average_rating} 
                  totalRatings={product.sellerRating.total_ratings}
                  size="sm"
                />
              </div>
            )}

            <div className="mt-1 flex items-end justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1 min-w-0 pr-1">
                <span className="truncate"> 
                  {formatLocation(product.city, product.province)}
                </span>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0"> 
                <span>{formatTimePosted(product.created_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})

ProductCard.displayName = "ProductCard"

export { ProductCard }

