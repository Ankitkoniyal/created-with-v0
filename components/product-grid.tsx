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

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  if (!hasOverride && !shouldFetch) {
    return null
  }

  if (loading) {
    return (
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            <LoadingSkeleton type="card" count={12} />
          </div>
        </div>
      </section>
    )
  }

  if (!hasOverride && error) {
    return (
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="text-center py-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Unable to Load Ads</h3>
            <p className="text-gray-600 mb-2 text-xs">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-green-900 hover:bg-green-950 text-xs h-7">
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="text-center py-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">No Ads Found</h3>
            <p className="text-gray-600 mb-2 text-xs">Be the first to post an ad in your area!</p>
            <Button asChild className="bg-green-900 hover:bg-green-950 text-xs h-7">
              <Link href="/post">Post Your First Ad</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-2">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 flex gap-2">
        {/* Main products grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {/* Product Cards */}
            {products.map((product) => {
              const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
              const optimizedPrimary = getOptimizedImageUrl(primaryImage, "thumb") || primaryImage
              const provinceOrLocation = product.province || product.location || ""

              return (
                <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
                  <Card className="group h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-none hover:border-green-600 transition-all duration-150">
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Image Container */}
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
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite(product.id, e)
                          }}
                          className={`absolute top-1 right-1 p-1 rounded ${
                            favorites.has(product.id) 
                              ? "text-red-500 bg-white/90" 
                              : "text-gray-400 hover:text-red-500 bg-white/80"
                          } transition-colors`}
                        >
                          <Heart 
                            className={`h-3 w-3 ${favorites.has(product.id) ? "fill-current" : ""}`} 
                          />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-1 flex flex-col flex-1">
                        <h4 className="text-xs font-medium text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors leading-none">
                          {capitalizeFirstLetter(product.title)}
                        </h4>

                        {/* Price */}
                        <div className="my-0.5">
                          <span className="text-xs font-bold text-gray-900">
                            {formatPrice(product.price as any, (product as any).price_type)}
                            {isNegotiable((product as any).price_type) && (
                              <span className="text-[10px] font-normal text-gray-600 ml-0.5">Negotiable</span>
                            )}
                          </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between text-[10px] text-gray-500">
                          <div className="flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate max-w-[60px]">
                              {provinceOrLocation}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5 flex-shrink-0" />
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
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-2">
            {/* Sidebar Ad with your image */}
            <div className="border border-gray-200 rounded-none overflow-hidden bg-white">
              {/* Your image */}
              <Image 
                src="https://gkaeeayfwrgekssmtuzn.supabase.co/storage/v1/object/public/product-images/fe09ea77-0be8-426e-9a88-9b4127f04a3c/side%20image.webp" 
                alt="Canada's #1 Growing Marketplace" 
                width={224} 
                height={300} 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
