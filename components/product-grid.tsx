"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect, useCallback, useMemo } from "react"
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
}

const PRODUCTS_PER_PAGE = 20

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const supabase = useMemo(() => createClient(), [])

  const fetchProducts = useCallback(
    async (currentPage: number, isRetry = false) => {
      const from = currentPage * PRODUCTS_PER_PAGE
      const to = from + PRODUCTS_PER_PAGE - 1

      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 8000))

        const queryPromise = supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, to)

        const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any

        if (error) {
          throw error
        }

        setRetryCount(0)
        return data || []
      } catch (err: any) {
        console.error("Error fetching products:", err)

        let errorMessage = "Failed to load ads"

        if (err.message === "Request timeout") {
          errorMessage = "Loading is taking too long. Please check your connection."
        } else if (err.message?.includes("network")) {
          errorMessage = "Network error. Please check your internet connection."
        } else if (err.code === "PGRST301") {
          errorMessage = "Service temporarily unavailable. Please try again."
        }

        if (!isRetry) {
          setError(errorMessage)
        }
        return null
      }
    },
    [supabase],
  )

  const handleRetry = useCallback(() => {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 8000)
    setRetryCount((prev) => prev + 1)
    setError(null)

    setTimeout(async () => {
      setIsLoading(true)
      const initialProducts = await fetchProducts(0, true)
      if (initialProducts) {
        setProducts(initialProducts)
        setHasMore(initialProducts.length === PRODUCTS_PER_PAGE)
        setPage(0)
      }
      setIsLoading(false)
    }, delay)
  }, [fetchProducts, retryCount])

  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true)
      const initialProducts = await fetchProducts(0)
      if (initialProducts) {
        setProducts(initialProducts)
        setHasMore(initialProducts.length === PRODUCTS_PER_PAGE)
      }
      setIsLoading(false)
    }
    initialFetch()
  }, [fetchProducts])

  const toggleFavorite = useCallback((productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(productId) ? next.delete(productId) : next.add(productId)
      return next
    })
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const nextPage = page + 1
    const newProducts = await fetchProducts(nextPage)
    if (newProducts) {
      setProducts((prev) => [...prev, ...newProducts])
      setPage(nextPage)
      setHasMore(newProducts.length === PRODUCTS_PER_PAGE)
    }
    setIsLoadingMore(false)
  }, [isLoadingMore, hasMore, page, fetchProducts])

  const formatPrice = useCallback((price: number, priceType: string) => {
    if (priceType === "free") return "Free"
    if (priceType === "contact") return "Contact for Price"
    return `$${price.toLocaleString()}`
  }, [])

  const formatTimePosted = useCallback((createdAt: string) => {
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`
    return posted.toLocaleDateString()
  }, [])

  if (isLoading) {
    return (
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-foreground">Latest Ads</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card
                key={i}
                className="h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-md animate-pulse"
              >
                <div className="w-full h-40 sm:h-48 lg:h-52 bg-gray-200"></div>
                <div className="p-2 flex flex-col flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Unable to Load Ads</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex justify-center space-x-2">
                <Button onClick={handleRetry} className="bg-green-600 hover:bg-green-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {retryCount > 0 ? `Retry (${retryCount + 1})` : "Try Again"}
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-foreground">Latest Ads</h3>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No ads posted yet. Be the first to post an ad!</p>
            <Link href="/sell" prefetch={false}>
              <Button className="bg-green-600 hover:bg-green-700">Post Your First Ad</Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-foreground">Latest Ads</h3>
          <p className="text-sm text-gray-600">{products.length} ads found</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
              <Card className="group h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-md hover:shadow-md transition-all duration-150">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative w-full h-40 sm:h-48 lg:h-52 overflow-hidden bg-gray-50">
                    <img
                      src={product.images?.[0] || "/placeholder.svg?height=200&width=200&query=product"}
                      alt={product.title}
                      loading="lazy"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />

                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Toggle favorite"
                      className="absolute top-1 right-1 bg-white/90 hover:bg-gray-100 shadow-sm h-5 w-5 p-0"
                      onClick={(e) => toggleFavorite(product.id, e)}
                    >
                      <Heart
                        className={`h-3 w-3 ${
                          favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-700"
                        }`}
                      />
                    </Button>

                    {product.featured && (
                      <Badge className="absolute top-1 left-1 bg-yellow-400 text-black text-[10px] font-semibold px-1 py-0.5 rounded">
                        Featured
                      </Badge>
                    )}

                    <Badge className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1 py-0.5 rounded">
                      ID: {product.id.slice(-8)}
                    </Badge>
                  </div>

                  <div className="p-2 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-bold text-black">{formatPrice(product.price, product.price_type)}</p>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {product.condition}
                      </Badge>
                    </div>

                    <h4 className="text-xs text-gray-700 leading-tight line-clamp-2 mb-1 min-h-[2rem]">
                      {product.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 uppercase tracking-wide mt-auto">
                      <span className="truncate">
                        {product.city}, {product.province}
                      </span>
                      <span className="whitespace-nowrap">{formatTimePosted(product.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-6">
            <Button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 text-sm font-medium rounded"
            >
              {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoadingMore ? "Loading..." : "Show More"}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
