"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { LoadingSkeleton } from "@/components/loading-skeleton"
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
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            <LoadingSkeleton type="card" count={10} />
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
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            {products.map((product) => {
              const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
              const optimizedPrimary = getOptimizedImageUrl(primaryImage, "thumb") || primaryImage
              const provinceOrLocation = product.province || product.location || ""

              return (
                <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
                  <Card className="h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-sm">
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Image Container */}
                      <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                        <Image
                          src={optimizedPrimary || "/placeholder.svg"}
                          alt={product.title}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw"
                          className="object-cover"
                          loading="lazy"
                        />
                        
                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite(product.id, e)
                          }}
                          className={`absolute top-1 right-1 p-1 rounded ${
                            favorites.has(product.id) 
                              ? "text-red-500 bg-white/90" 
                              : "text-gray-400 bg-white/80"
                          }`}
                        >
                          <Heart 
                            className={`h-3.5 w-3.5 ${favorites.has(product.id) ? "fill-current" : ""}`} 
                          />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-2 flex flex-col flex-1">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 leading-tight">
                          {product.title}
                        </h4>

                        {/* Price */}
                        <div className="mb-1">
                          <span className="text-base font-bold text-gray-900">
                            {formatPrice(product.price as any, (product as any).price_type)}
                            {isNegotiable((product as any).price_type) && (
                              <span className="text-xs font-normal text-gray-600 ml-1">Negotiable</span>
                            )}
                          </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
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
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right sidebar for vertical ad */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            {/* Sidebar Ad with your image */}
            <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
              <Image 
                src="https://gkaeeayfwrgekssmtuzn.supabase.co/storage/v1/object/public/product-images/fe09ea77-0be8-426e-9a88-9b4127f04a3c/side%20image.webp" 
                alt="Canada's #1 Growing Marketplace" 
                width={256} 
                height={600} 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
