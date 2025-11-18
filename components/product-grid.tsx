// components/product-grid.tsx - FIXED WITH SELLER NAMES
"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { getOptimizedImageUrl } from "@/lib/images"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams, usePathname } from "next/navigation"
import { StarRating } from "@/components/ui/star-rating"
import { ErrorBoundary } from "@/components/error-boundary"
import { ProductCard } from "@/components/product-card-optimized"
import React from "react"

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
  }
  sellerRating?: {
    average_rating: number
    total_ratings: number
  }
}

interface ProductGridProps {
  products?: Product[]
  searchQuery?: string
  filters?: {
    category?: string
    subcategory?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
    sortBy?: string
  }
}

const PRODUCTS_PER_PAGE = 20

export function ProductGrid({ products: overrideProducts, searchQuery, filters }: ProductGridProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const locationFilter = searchParams.get("location") || ""
  const hasOverride = Array.isArray(overrideProducts)
  
  const shouldFetch = useMemo(() => typeof window !== 'undefined' && (
    pathname === "/" ||
    pathname?.startsWith("/search") ||
    pathname?.startsWith("/category") ||
    pathname?.startsWith("/seller") ||
    pathname?.startsWith("/product")
  ), [pathname])

  useEffect(() => {
    async function fetchProducts() {
      try {
        if (typeof window === 'undefined') {
          setLoading(false)
          return
        }

        const supabase = createClient()
        
        if (!supabase) {
          throw new Error('Supabase client not available.')
        }

        // FIXED: Include seller data in the query
        let query = supabase
          .from('products')
          .select(`
            *,
            seller:profiles!user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('status', 'active')

        // Apply search query filter
        if (searchQuery) {
          query = query.ilike('title', `%${searchQuery}%`)
        }

        // Apply category filter
        if (filters?.category && filters.category !== 'all' && filters.category !== '') {
          query = query.eq('category', filters.category)
        }

        // Apply subcategory filter
        if (filters?.subcategory && filters.subcategory !== 'all' && filters.subcategory !== '') {
          query = query.eq('subcategory', filters.subcategory)
        }

        // Apply condition filter
        if (filters?.condition && filters.condition !== 'all') {
          query = query.eq('condition', filters.condition)
        }

        // Apply price filters
        if (filters?.minPrice) {
          query = query.gte('price', parseInt(filters.minPrice))
        }
        if (filters?.maxPrice) {
          query = query.lte('price', parseInt(filters.maxPrice))
        }

        // Apply category-specific filters
        if (filters?.category) {
          const resolvedCategory = resolveCategoryInput(filters.category)
          if (resolvedCategory) {
            const categoryFilterConfig = getFiltersForCategory(resolvedCategory.slug)
            if (categoryFilterConfig) {
              Object.entries(categoryFilterConfig.filters).forEach(([key, filterConfig]) => {
                const fieldName = getFilterFieldName(key)
                const filterValue = (filters as any)[fieldName] as string | undefined

                if (filterValue) {
                  if (filterConfig.type === "select") {
                    query = query.eq(fieldName, filterValue)
                  } else if (filterConfig.type === "text") {
                    query = query.ilike(fieldName, `%${filterValue}%`)
                  } else if (filterConfig.type === "number") {
                    const numValue = parseInt(filterValue)
                    if (!isNaN(numValue)) {
                      query = query.eq(fieldName, numValue)
                    }
                  } else if (filterConfig.type === "range") {
                    const minKey = `${key}_min`
                    const maxKey = `${key}_max`
                    const minValue = (filters as any)[minKey] as string | undefined
                    const maxValue = (filters as any)[maxKey] as string | undefined

                    if (minValue) {
                      const min = parseInt(minValue)
                      if (!isNaN(min)) {
                        query = query.gte(fieldName, min)
                      }
                    }
                    if (maxValue) {
                      const max = parseInt(maxValue)
                      if (!isNaN(max)) {
                        query = query.lte(fieldName, max)
                      }
                    }
                  }
                }
              })
            }
          }
        }

        // Apply location filter
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

        // Apply sorting
        if (filters?.sortBy) {
          switch (filters.sortBy) {
            case 'price-low':
              query = query.order('price', { ascending: true })
              break
            case 'price-high':
              query = query.order('price', { ascending: false })
              break
            case 'newest':
            default:
              query = query.order('created_at', { ascending: false })
              break
          }
        } else {
          query = query.order('created_at', { ascending: false })
        }

        // Initial page
        query = query.range(0, PRODUCTS_PER_PAGE - 1)

        const { data, error } = await query

        if (error) {
          throw error
        }

        // Fetch rating stats for all sellers
        const userIds = [...new Set((data || []).map(p => p.user_id).filter(Boolean))]
        let ratingsMap = new Map<string, { average_rating: number; total_ratings: number }>()
        
        if (userIds.length > 0) {
          const { data: ratingStats } = await supabase
            .from('user_rating_stats')
            .select('to_user_id, average_rating, total_ratings')
            .in('to_user_id', userIds)
          
          if (ratingStats) {
            ratingStats.forEach(stat => {
              ratingsMap.set(stat.to_user_id, {
                average_rating: stat.average_rating || 0,
                total_ratings: stat.total_ratings || 0
              })
            })
          }
        }

        // Merge rating data with products
        const productsWithRatings = (data || []).map(product => ({
          ...product,
          sellerRating: ratingsMap.get(product.user_id) || { average_rating: 0, total_ratings: 0 }
        }))

        setProducts(productsWithRatings)
        setHasMore((data || []).length === PRODUCTS_PER_PAGE)
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
  }, [hasOverride, overrideProducts, shouldFetch, locationFilter, searchQuery, filters?.category, filters?.subcategory, filters?.condition, filters?.minPrice, filters?.maxPrice, filters?.sortBy])

  const toggleFavorite = useCallback((productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(productId) ? next.delete(productId) : next.add(productId)
      return next
    })
  }, [])

  const formatPrice = useCallback((price?: number, priceType?: string) => {
    if (priceType === "free") return "Free"
    if (priceType === "contact") return "Contact"
    if (typeof price === "number") {
      return `$${price.toLocaleString()}`
    }
    return "Contact"
  }, [])

  const isNegotiable = useCallback((priceType?: string) => {
    return priceType === "negotiable" || priceType === "contact"
  }, [])

  const formatTimePosted = useCallback((createdAt?: string) => {
    if (!createdAt) return ""
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 48) return "1d"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`
    return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }, [])

  // Allow unregistered users to view seller ads
  const handleSellerClick = (e: React.MouseEvent, sellerId: string) => {
    e.preventDefault()
    e.stopPropagation()
    // Allow anyone to view seller ads without login
    window.location.href = `/seller/${sellerId}`
  }

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
              {searchQuery ? `No results for "${searchQuery}"` : "No Ads Found"}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {searchQuery 
                ? "Try different keywords or remove some filters."
                : "Be the first to post an ad in your area!"
              }
            </p>
            <Button asChild className="bg-green-900 hover:bg-green-950 text-xs h-8">
              <Link href="/post">Post Your First Ad</Link>
            </Button>
            {searchQuery && (
              <Button 
                variant="outline" 
                className="ml-2 text-xs h-8"
                onClick={() => window.location.href = '/search'}
              >
                Clear Search
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  }

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const supabase = createClient()
      if (!supabase) return

      // Build the same query conditions as initial load
      let query = supabase
        .from('products')
        .select(`
          *,
          seller:profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'active')

      if (searchQuery) query = query.ilike('title', `%${searchQuery}%`)
      if (filters?.category && filters.category !== 'all' && filters.category !== '') query = query.eq('category', filters.category)
      if (filters?.subcategory && filters.subcategory !== 'all' && filters.subcategory !== '') query = query.eq('subcategory', filters.subcategory)
      if (filters?.condition && filters.condition !== 'all') query = query.eq('condition', filters.condition)
      if (filters?.minPrice) query = query.gte('price', parseInt(filters.minPrice))
      if (filters?.maxPrice) query = query.lte('price', parseInt(filters.maxPrice))

      // Location filter
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

      // Sorting
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'price-low':
            query = query.order('price', { ascending: true })
            break
          case 'price-high':
            query = query.order('price', { ascending: false })
            break
          case 'newest':
          default:
            query = query.order('created_at', { ascending: false })
            break
        }
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const from = products.length
      const to = from + PRODUCTS_PER_PAGE - 1
      const { data, error } = await query.range(from, to)
      if (error) throw error

      // Ratings enrichment
      const userIds = [...new Set((data || []).map(p => p.user_id).filter(Boolean))]
      let ratingsMap = new Map<string, { average_rating: number; total_ratings: number }>()
      if (userIds.length > 0) {
        const { data: ratingStats } = await supabase
          .from('user_rating_stats')
          .select('to_user_id, average_rating, total_ratings')
          .in('to_user_id', userIds)
        if (ratingStats) {
          ratingStats.forEach(stat => {
            ratingsMap.set(stat.to_user_id, {
              average_rating: stat.average_rating || 0,
              total_ratings: stat.total_ratings || 0
            })
          })
        }
      }
      const productsWithRatings = (data || []).map(product => ({
        ...product,
        sellerRating: ratingsMap.get(product.user_id) || { average_rating: 0, total_ratings: 0 }
      }))
      setProducts(prev => [...prev, ...productsWithRatings])
      setHasMore((data || []).length === PRODUCTS_PER_PAGE)
    } catch (e) {
      // swallow load more errors silently
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <section className="py-4 bg-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-600">
              Found {products.length} {products.length === 1 ? 'result' : 'results'}
              {searchQuery && ` for "${searchQuery}"`}
            </div>
            
            <ErrorBoundary>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-4 gap-y-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favorites.has(product.id)}
                    onToggleFavorite={toggleFavorite}
                    formatPrice={formatPrice}
                    isNegotiable={isNegotiable}
                    formatTimePosted={formatTimePosted}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={loadMore} 
                    disabled={isLoadingMore}
                    className="bg-green-900 hover:bg-green-950"
                  >
                    {isLoadingMore ? "Loading..." : "Show More"}
                  </Button>
                </div>
              )}
            </ErrorBoundary>
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
