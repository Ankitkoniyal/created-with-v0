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

const PRODUCTS_PER_PAGE = 24 // Show more products in compact view

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
      if (price >= 1000) return `$${(price/1000).toFixed(0)}k`
      return `$${price}`
    }
    return "Contact"
  }

  const getConditionBadge = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case "new":
        return { text: "New", className: "bg-green-500 text-white text-[10px] px-1.5 py-0.5" }
      case "like new":
        return { text: "Like New", className: "bg-green-400 text-white text-[10px] px-1.5 py-0.5" }
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
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            <LoadingSkeleton type="card" count={16} />
          </div>
        </div>
      </section>
    )
  }

  if (!hasOverride && error) {
    return (
      <section className="py-2">
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
      <section className="py-2">
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
    <section className="py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TooltipProvider>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {products.map((product) => {
              const conditionBadge = getConditionBadge(product.condition)
              const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
              const optimizedPrimary = getOptimizedImageUrl(primaryImage, "thumb") || primaryImage
              const provinceOrLocation = product.province || product.location || ""

              return (
                <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
                  <Card className="group h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Image Container */}
                      <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                        <Image
                          src={optimizedPrimary || "/placeholder.svg"}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12.5vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        
                        {/* Top Right Badges */}
                        <div className="absolute top-1 right-1 flex flex-col gap-1">
                          {conditionBadge && (
                            <Badge className={conditionBadge.className}>
                              {conditionBadge.text}
                            </Badge>
                          )}
                        </div>

                        {/* Price Badge */}
                        <div className="absolute bottom-1 left-1 bg-black/80 text-white px-1.5 py-0.5 rounded-sm">
                          <span className="text-xs font-bold">
                            {formatPrice(product.price as any, (product as any).price_type)}
                          </span>
                        </div>

                        {/* Wishlist Button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Toggle favorite"
                              className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm hover:bg-white shadow-xs h-6 w-6 p-0 rounded-sm"
                              onClick={(e) => toggleFavorite(product.id, e)}
                            >
                              <Heart
                                className={`h-3 w-3 ${
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

                      {/* Product Info - Compact */}
                      <div className="p-1.5 flex flex-col flex-1">
                        <h4 className="text-xs text-gray-800 leading-tight line-clamp-2 mb-1 font-medium group-hover:text-primary transition-colors">
                          {product.title}
                        </h4>

                        <div className="mt-auto space-y-1">
                          {/* Location and Time */}
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[60px]">
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
    </section>
  )
}
