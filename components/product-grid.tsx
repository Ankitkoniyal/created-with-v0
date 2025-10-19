"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Clock } from "lucide-react"// components/product-grid.tsx - FIXED VERSION
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

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
  images: string[]
  created_at: string
}

// Mock data to prevent API build issues
const mockProducts: Product[] = [
  {
    id: "1",
    title: "iPhone 13 Pro Max 256GB - Excellent Condition",
    price: 999,
    price_type: "fixed",
    location: "Toronto, ON",
    city: "Toronto",
    province: "ON",
    condition: "excellent",
    category: "Electronics",
    images: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "MacBook Pro 2023 M2 Chip 16GB RAM",
    price: 1899,
    price_type: "fixed",
    location: "Vancouver, BC",
    city: "Vancouver",
    province: "BC",
    condition: "like new",
    category: "Electronics",
    images: [],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "Samsung Galaxy S23 Ultra 512GB",
    price: 1199,
    price_type: "negotiable",
    location: "Montreal, QC",
    city: "Montreal",
    province: "QC",
    condition: "excellent",
    category: "Electronics",
    images: [],
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  }
]

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Use mock data temporarily to fix build
    setTimeout(() => {
      setProducts(mockProducts)
      setLoading(false)
    }, 1000)
  }, [])

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(productId) ? next.delete(productId) : next.add(productId)
      return next
    })
  }

  const formatPrice = (price: number, priceType: string) => {
    if (priceType === "free") return "Free"
    if (priceType === "contact") return "Contact"
    return `$${price.toLocaleString()}`
  }

  const formatTimePosted = (createdAt: string) => {
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 48) return "1d"
    return `${Math.floor(diffInHours / 24)}d`
  }

  if (loading) {
    return (
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-4 bg-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-4 gap-y-6">
              {products.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
                  <div className="h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-sm hover:shadow-md transition-shadow">
                    <div className="p-0 flex flex-col h-full">
                      <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">📱</span>
                        </div>
                        
                        <button
                          onClick={(e) => toggleFavorite(product.id, e)}
                          className={`absolute top-1 right-1 p-1 rounded ${
                            favorites.has(product.id) 
                              ? "text-red-500 bg-white/90" 
                              : "text-gray-400 bg-white/80"
                          }`}
                        >
                          {favorites.has(product.id) ? "❤️" : "🤍"}
                        </button>
                      </div>

                      <div className="px-2 py-0 flex flex-col flex-1">
                        <div className="mb-1">
                          <span className="text-base font-bold text-green-700">
                            {formatPrice(product.price, product.price_type)}
                            {product.price_type === "negotiable" && (
                              <span className="text-xs font-normal text-gray-600 ml-1">Negotiable</span>
                            )}
                          </span>
                        </div>
                          
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 leading-tight">
                          {product.title}
                        </h4>

                        <div className="mt-auto flex items-end justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1 min-w-0 pr-1">
                            <span>📍</span>
                            <span className="truncate"> 
                              {product.city}, {product.province}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span>🕒</span>
                            <span>{formatTimePosted(product.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">Side Banner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import Image from "next/image"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { getOptimizedImageUrl } from "@/lib/images"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams, usePathname } from "next/navigation"

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
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const locationFilter = searchParams.get("location") || ""
  const hasOverride = Array.isArray(overrideProducts)
  
  // FIX 1: Add build-time check to prevent server-side API calls
  const shouldFetch = typeof window !== 'undefined' && (
    pathname === "/" ||
    pathname?.startsWith("/search") ||
    pathname?.startsWith("/category") ||
    pathname?.startsWith("/seller") ||
    pathname?.startsWith("/product")
  )

  useEffect(() => {
    async function fetchProducts() {
      try {
        // FIX 2: Skip API call during build
        if (typeof window === 'undefined') {
          setLoading(false)
          return
        }

        const supabase = createClient()
        
        if (!supabase) {
          throw new Error('Supabase client not available. Check your environment variables.')
        }

        let query = supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(PRODUCTS_PER_PAGE)

        if (locationFilter) {
          const locationQuery = locationFilter.toLowerCase()
          
          if (locationQuery.includes(",")) {
            const [cityPart, provincePart] = locationQuery.split(",").map(s => s.trim())
            
            if (cityPart && provincePart) {
              query = query.ilike("city", `%${cityPart}%`).ilike("province", `%${provincePart}%`)
            } else if (cityPart) {
              query = query.ilike("city", `%${cityPart}%`)
            }
          } else {
            query = query.or(`city.ilike.%${locationQuery}%,province.ilike.%${locationQuery}%`)
          }
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        setProducts(data || [])
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred')
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
  }, [hasOverride, overrideProducts, shouldFetch, locationFilter])

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

  // FIX 3: Return loading state during build
  if (typeof window === 'undefined') {
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

  if (error) {
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locationFilter ? `No Ads Found in ${locationFilter}` : "No Ads Found"}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {locationFilter 
                ? "Try searching in a nearby area or broaden your location search."
                : "Be the first to post an ad in your area!"
              }
            </p>
            <Button asChild className="bg-green-900 hover:bg-green-950 text-xs h-8">
              <Link href="/post">Post Your First Ad</Link>
            </Button>
            {locationFilter && (
              <Button 
                variant="outline" 
                className="ml-2 text-xs h-8"
                onClick={() => window.location.href = '/'}
              >
                Clear Location
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-4 bg-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-4 gap-y-6">
              {products.map((product) => {
                const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
                const optimizedPrimary = getOptimizedImageUrl(primaryImage, "thumb") || primaryImage

                return (
                  <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
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

                        <div className="px-2 py-0 flex flex-col flex-1">
                          <div className="mb-1">
                            <span className="text-base font-bold text-green-700">
                              {formatPrice(product.price as any, (product as any).price_type)}
                              {isNegotiable((product as any).price_type) && (
                                <span className="text-xs font-normal text-gray-600 ml-1">Negotiable</span>
                              )}
                            </span>
                          </div>
                            
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 leading-tight">
                            {product.title}
                          </h4>

                          <div className="mt-auto flex items-end justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1 min-w-0 pr-1">
                              <span className="truncate"> 
                                {product.city}, {product.province}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 flex-shrink-0"> 
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

          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
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
      </div>
    </section>
  )
}
