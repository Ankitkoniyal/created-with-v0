"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { getOptimizedImageUrl } from "@/lib/images"
import { createClient } from "@/lib/supabase/client"

interface Product {
  id: string
  title: string
  price: number
  price_type: string
  location: string
  city: string
  province: string
  condition: string
  category: string
  subcategory?: string
  brand?: string
  model?: string
  description: string
  images: string[]
  created_at: string
  user_id: string
  featured?: boolean
  seller?: {
    id: string
    full_name: string
    avatar_url?: string
    rating?: number
  }
}

const PRODUCTS_PER_PAGE = 20 // Adjusted for new layout

export function ProductGrid({ products: overrideProducts }: { products?: Product[] }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [shouldFetch, setShouldFetch] = useState(false)

  const hasOverride = Array.isArray(overrideProducts)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname
      const allow =
        p === "/" ||
        p.startsWith("/search") ||
        p.startsWith("/category") ||
        p.startsWith("/seller") ||
        p.startsWith("/product")
      setShouldFetch(allow)
    }
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      try {
        const supabase = createClient()
        
        if (!supabase) {
          throw new Error('Supabase client not available. Check your environment variables.')
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(PRODUCTS_PER_PAGE)

        if (error) {
          throw error
        }

        setProducts(data || [])
      } catch (err) {
        setError(err.message)
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!hasOverride && shouldFetch) {
      fetchProducts()
    } else if (hasOverride) {
      setProducts(overrideProducts as Product[])
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [hasOverride, overrideProducts, shouldFetch])

  const toggleFavorite = (productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(productId) ? next.delete(productId) : next.add(productId)
      return next
    })
  }

  const formatPrice = (price?: number, priceType?: string) => {
    if (priceType === "free") return "Free"
    if (priceType === "contact") return "Contact"
    if (typeof price === "number") {
      if (price >= 1000) return `¥${(price/1000).toFixed(0)}k`
      return `¥${price}`
    }
    return "Contact"
  }

  const getConditionBadge = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case "new":
        return { text: "New", className: "bg-green-500 text-white text-xs px-2 py-1" }
      case "like new":
        return { text: "Like New", className: "bg-green-400 text-white text-xs px-2 py-1" }
      case "second hand":
        return { text: "Second Hand", className: "bg-blue-500 text-white text-xs px-2 py-1" }
      default:
        return null
    }
  }

  const isNegotiable = (priceType?: string) => {
    return priceType === "negotiable" || priceType === "contact"
  }

  const formatTimePosted = (createdAt?: string) => {
    if (!createdAt) return ""
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 48) return "1d"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`
    return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!hasOverride && !shouldFetch) {
    return null
  }

  if (loading) {
    return (
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <LoadingSkeleton type="card" count={12} />
          </div>
        </div>
      </section>
    )
  }

  if (!hasOverride && error) {
    return (
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Ads</h3>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-green-900 hover:bg-green-950 text-xs h-8">
              Try Again
            </Button>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Ads Found</h3>
            <p className="text-gray-600 mb-4 text-sm">Be the first to post an ad in your area!</p>
            <Button asChild className="bg-green-900 hover:bg-green-950 text-xs h-8">
              <Link href="/post">Post Your First Ad</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
        {/* Main products grid */}
        <div className="flex-1">
          <TooltipProvider>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const conditionBadge = getConditionBadge(product.condition)
                const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
                const optimizedPrimary = getOptimizedImageUrl(primaryImage, "thumb") || primaryImage
                const provinceOrLocation = product.province || product.location || ""

                return (
                  <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
                    <Card className="group h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-md hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-0 flex flex-col h-full">
                        {/* Image Container - Full width with minimal padding */}
                        <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                          <Image
                            src={optimizedPrimary || "/placeholder.svg"}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          
                          {/* Top Right Badges */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            {conditionBadge && (
                              <Badge className={conditionBadge.className}>
                                {conditionBadge.text}
                              </Badge>
                            )}
                          </div>

                          {/* Price Badge */}
                          <div className="absolute bottom-2 left-2 bg-black/90 text-white px-3 py-1.5 rounded-md">
                            <span className="text-sm font-bold">
                              {formatPrice(product.price as any, (product as any).price_type)}
                              {isNegotiable((product as any).price_type) && (
                                <span className="text-xs font-normal ml-1">Negotiable</span>
                              )}
                            </span>
                          </div>

                          {/* Wishlist Button */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Toggle favorite"
                                className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md h-8 w-8 p-0 rounded-full"
                                onClick={(e) => toggleFavorite(product.id, e)}
                              >
                                <Heart
                                  className={`h-4 w-4 ${
                                    favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                                  }`}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{favorites.has(product.id) ? "Remove from favorites" : "Add to favorites"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Product Info - Minimal details */}
                        <div className="p-3 flex flex-col flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mb-2 group-hover:text-green-700 transition-colors">
                            {product.title}
                          </h4>

                          <div className="mt-auto space-y-2">
                            {/* Seller info if available */}
                            {product.seller && (
                              <div className="flex items-center text-xs text-gray-600">
                                <span className="font-medium">{product.seller.full_name}</span>
                                {product.seller.rating && (
                                  <span className="ml-2 bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                    {product.seller.rating}★
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Location and Time */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {provinceOrLocation}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>{formatTimePosted(product.created_at as any)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </TooltipProvider>
        </div>

        {/* Right sidebar for vertical ad */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            {/* Placeholder for your vertical ad */}
            <div className="bg-gray-100 border border-gray-200 rounded-md overflow-hidden h-[600px] flex items-center justify-center">
              <span className="text-gray-500 text-sm">Vertical Ad Space</span>
              {/* Replace with your actual ad component */}
              {/* <Image src="/your-vertical-ad.jpg" alt="Advertisement" width={256} height={600} className="object-cover" /> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
