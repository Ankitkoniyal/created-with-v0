"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Clock, Home } from "lucide-react"
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
        setLoading(true)
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
        setError(null)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err.message || 'Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (!hasOverride && shouldFetch) {
      fetchProducts()
    } else if (hasOverride) {
      setProducts(overrideProducts as Product[])
      setLoading(false)
      setError(null)
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

  const retryFetch = () => {
    if (!hasOverride && shouldFetch) {
      setLoading(true)
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
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

  if (error) {
    return (
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="bg-red-50 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong!</h3>
              <p className="text-red-600 mb-6">We encountered an unexpected error. Please try again or return to the homepage.</p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={retryFetch} 
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
                <Button asChild variant="outline">
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Back to Homepage
                  </Link>
                </Button>
              </div>
            </div>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Product Cards */}
            {products.map((product) => {
              const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
              const optimizedPrimary = getOptimizedImageUrl(primaryImage, "thumb") || primaryImage
              const provinceOrLocation = product.province || product.location || ""

              return (
                <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
                  <Card className="group h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-md hover:border-green-600 hover:shadow-sm transition-all duration-200">
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
                          className={`absolute top-2 right-2 p-1.5 rounded-md ${
                            favorites.has(product.id) 
                              ? "text-red-500 bg-white/90" 
                              : "text-gray-400 hover:text-red-500 bg-white/80"
                          } transition-colors shadow-sm`}
                        >
                          <Heart 
                            className={`h-3.5 w-3.5 ${favorites.has(product.id) ? "fill-current" : ""}`} 
                          />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-2 flex flex-col flex-1">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors mb-1">
                          {capitalizeFirstLetter(product.title)}
                        </h4>

                        {/* Price */}
                        <div className="mb-1.5">
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
              {/* Your image */}
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
