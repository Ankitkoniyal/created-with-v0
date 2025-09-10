"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
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

const PRODUCTS_PER_PAGE = 20

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
      return `$${price.toLocaleString()}`
    }
    return "Contact"
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-4">
        {/* Main products grid */}
        <div className="flex-1">
          <TooltipProvider>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => {
                const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
                const optimizedPrimary = getOptimizedImageUrl(primaryImage, "thumb") || primaryImage
                const provinceOrLocation = product.province || product.location || ""

                return (
                  <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
                    <Card className="group h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-sm hover:border-green-600 transition-all duration-200">
                      <CardContent className="p-0 flex flex-col h-full">
                        {/* Image Container - Full width with no extra space */}
                        <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                          <Image
                            src={optimizedPrimary || "/placeholder.svg"}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            className="object-cover"
                            loading="lazy"
                          />
                          
                          {/* Wishlist Button */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Toggle favorite"
                                className="absolute top-1 right-1 bg-white/90 hover:bg-white shadow-sm h-6 w-6 p-0 rounded-sm"
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

                        {/* Product Info - Minimal details */}
                        <div className="p-2 flex flex-col flex-1">
                          <h4 className="text-xs font-medium text-gray-900 leading-tight line-clamp-2 mb-1 group-hover:text-green-700 transition-colors">
                            {product.title}
                          </h4>

                          {/* Price */}
                          <div className="mb-1">
                            <span className="text-sm font-bold text-gray-900">
                              {formatPrice(product.price as any, (product as any).price_type)}
                              {isNegotiable((product as any).price_type) && (
                                <span className="text-xs font-normal text-gray-600 ml-1">Negotiable</span>
                              )}
                            </span>
                          </div>

                          <div className="mt-auto space-y-1">
                            {/* Location and Time */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate max-w-[70px]">
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
            {/* Sidebar Ad */}
            <div className="bg-gradient-to-b from-green-700 to-green-900 border border-green-800 rounded-md overflow-hidden text-white">
              <div className="p-4">
                <h3 className="text-lg font-bold text-center mb-2">CANADA'S #1 GROWING MARKETPLACE</h3>
                <p className="text-center text-sm mb-4">BUY. SELL. CONNECT. ALL IN ONE PLACE.</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-green-800/50 p-2 rounded text-center text-xs">ELECTRONICS</div>
                  <div className="bg-green-800/50 p-2 rounded text-center text-xs">CARS</div>
                  <div className="bg-green-800/50 p-2 rounded text-center text-xs">REAL ESTATE</div>
                  <div className="bg-green-800/50 p-2 rounded text-center text-xs">JOBS</div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs">
                    <span className="bg-green-500 rounded-full h-4 w-4 flex items-center justify-center mr-2">✔</span>
                    <span>UNLIMITED ADS</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="bg-green-500 rounded-full h-4 w-4 flex items-center justify-center mr-2">✔</span>
                    <span>ADD WEBSITE LINK</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="bg-green-500 rounded-full h-4 w-4 flex items-center justify-center mr-2">✔</span>
                    <span>FREE WEBSITE URL</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="bg-green-500 rounded-full h-4 w-4 flex items-center justify-center mr-2">✔</span>
                    <span>FREE YOUTUBE VIDEO</span>
                  </div>
                </div>
                
                <Button className="w-full bg-white text-green-800 hover:bg-gray-100 font-bold py-2 text-sm">
                  POST FREE AD TODAY
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
