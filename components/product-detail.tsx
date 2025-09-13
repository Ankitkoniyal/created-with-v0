"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Clock, Share2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { getOptimizedImageUrl } from "@/lib/images"

interface ProductDetailProps {
  product: {
    id: string
    title: string
    price: string
    location: string
    images: string[]
    description: string
    category: string
    condition: string
    brand?: string
    model?: string
    postedDate: string
    views: number
    adId: string
    seller: {
      id: string
      name: string
      rating: number
      totalReviews: number
      memberSince: string
      verified: boolean
      responseTime: string
    }
    features: string[]
    storage?: string
    color?: string
    youtube_url?: string
    website_url?: string
  }
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedImage, setSelectedImage] = useState(0)

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist or may have been removed.</p>
        </div>
      </div>
    )
  }

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(productId) ? next.delete(productId) : next.add(productId)
      return next
    })
  }

  const formatTimePosted = (createdAt: string) => {
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  const conditionBadge = () => {
    switch (product.condition?.toLowerCase()) {
      case "new":
        return { text: "New", className: "bg-green-500 text-white" }
      case "like new":
        return { text: "Like New", className: "bg-green-400 text-white" }
      case "used":
        return { text: "Used", className: "bg-blue-500 text-white" }
      default:
        return { text: product.condition || "Unknown", className: "bg-gray-500 text-white" }
    }
  }

  const badge = conditionBadge()

  return (
    <div className="max-w-6xl mx-auto">
      <TooltipProvider>
        {/* Product Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Ad ID: {product.adId}</span>
            <span>•</span>
            <span>{formatTimePosted(product.postedDate)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{product.views} views</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={getOptimizedImageUrl(product.images[selectedImage], "large")}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm"
                onClick={() => toggleFavorite(product.id)}
              >
                <Heart
                  className={`h-5 w-5 ${
                    favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                  }`}
                />
              </Button>
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-gray-100 rounded-md overflow-hidden border-2 ${
                      selectedImage === index ? "border-green-500" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={getOptimizedImageUrl(image, "thumb") || "/placeholder.svg"}
                      alt={`${product.title} ${index + 1}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Price and Condition */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">{product.price}</div>
                <Badge className={badge.className}>{badge.text}</Badge>
              </div>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span>{product.location}</span>
            </div>

            {/* Description */}
            <div className="prose prose-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {product.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.brand && (
                <div>
                  <span className="font-semibold text-gray-600">Brand:</span>
                  <span className="ml-2">{product.brand}</span>
                </div>
              )}
              {product.model && (
                <div>
                  <span className="font-semibold text-gray-600">Model:</span>
                  <span className="ml-2">{product.model}</span>
                </div>
              )}
              {product.storage && (
                <div>
                  <span className="font-semibold text-gray-600">Storage:</span>
                  <span className="ml-2">{product.storage}</span>
                </div>
              )}
              {product.color && (
                <div>
                  <span className="font-semibold text-gray-600">Color:</span>
                  <span className="ml-2">{product.color}</span>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Seller Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{product.seller.name}</span>
                    {product.seller.verified && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{product.seller.rating}★</span>
                    <span>•</span>
                    <span>{product.seller.totalReviews} reviews</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Member since {product.seller.memberSince}
                  </div>
                  <div className="text-sm text-gray-600">
                    {product.seller.responseTime}
                  </div>
                </div>
                <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                  Contact Seller
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
