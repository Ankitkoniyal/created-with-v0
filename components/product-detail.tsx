"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Clock, Share2, Eye, MessageCircle } from "lucide-react"
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

  // Get last 6 digits of real product ID
  const realAdId = product.id.slice(-6).toUpperCase()
  
  const badge = conditionBadge()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <TooltipProvider>
        {/* Product Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            <span className="bg-gray-100 px-2 py-1 rounded-md">Ad ID: {realAdId}</span>
            <span>•</span>
            <span>{formatTimePosted(product.postedDate)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{product.views} views</span>
            </div>
            <span>•</span>
            <span className="capitalize">{product.condition}</span>
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
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm shadow-md"
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
                    className={`aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === index ? "border-green-500 scale-105" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={getOptimizedImageUrl(image, "thumb")}
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
                <Badge className={`${badge.className} text-sm`}>{badge.text}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant={favorites.has(product.id) ? "default" : "outline"} 
                  size="icon" 
                  className="h-10 w-10"
                  onClick={() => toggleFavorite(product.id)}
                >
                  <Heart className={`h-4 w-4 ${favorites.has(product.id) ? "fill-white" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-gray-600 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600" />
              <span className="font-medium">{product.location}</span>
            </div>

            {/* Description */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Description</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {product.description || "No description provided."}
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs py-1 px-2">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Details */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {product.brand && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-semibold text-gray-600">Brand:</span>
                      <span className="text-gray-900">{product.brand}</span>
                    </div>
                  )}
                  {product.model && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-semibold text-gray-600">Model:</span>
                      <span className="text-gray-900">{product.model}</span>
                    </div>
                  )}
                  {product.storage && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-semibold text-gray-600">Storage:</span>
                      <span className="text-gray-900">{product.storage}</span>
                    </div>
                  )}
                  {product.color && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-semibold text-gray-600">Color:</span>
                      <span className="text-gray-900">{product.color}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-600">Condition:</span>
                    <span className="text-gray-900 capitalize">{product.condition}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-600">Category:</span>
                    <span className="text-gray-900">{product.category}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card className="border-green-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Seller Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-lg">{product.seller.name}</span>
                    {product.seller.verified && (
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                      <span className="text-blue-700 font-semibold">{product.seller.rating}★</span>
                      <span className="text-blue-600">({product.seller.totalReviews} reviews)</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <strong>Member since:</strong> {product.seller.memberSince}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <strong>Response time:</strong> {product.seller.responseTime}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 h-12">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Seller
                  </Button>
                  <Button variant="outline" className="h-12 px-6">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
