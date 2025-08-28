"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Loader2, MapPin, Clock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { useAsyncOperation } from "@/hooks/use-async-operation"

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

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const supabase = createClient()

  const {
    loading: isLoading,
    error,
    execute: fetchProducts,
    retry,
  } = useAsyncOperation(
    async () => {
      const from = 0 * PRODUCTS_PER_PAGE
      const to = from + PRODUCTS_PER_PAGE - 1

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          seller:profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw new Error(`Failed to load ads: ${error.message}`)

      setProducts(data || [])
      setHasMore((data || []).length === PRODUCTS_PER_PAGE)
      return data || []
    },
    {
      retries: 3,
      retryDelay: 1000,
      onError: (error) => console.error("Error fetching products:", error),
    },
  )

  const { loading: isLoadingMore, execute: loadMore } = useAsyncOperation(
    async () => {
      if (!hasMore) return []

      const nextPage = page + 1
      const from = nextPage * PRODUCTS_PER_PAGE
      const to = from + PRODUCTS_PER_PAGE - 1

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          seller:profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw new Error(`Failed to load more ads: ${error.message}`)

      setProducts((prev) => [...prev, ...(data || [])])
      setPage(nextPage)
      setHasMore((data || []).length === PRODUCTS_PER_PAGE)
      return data || []
    },
    {
      retries: 2,
      retryDelay: 500,
    },
  )

  useEffect(() => {
    fetchProducts()
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
    if (priceType === "contact") return "Contact for Price"
    return `$${price.toLocaleString()}`
  }

  const getConditionBadge = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case "new":
        return { text: "New", className: "bg-green-500 text-white" }
      case "like new":
        return { text: "Like New", className: "bg-green-400 text-white" }
      case "good":
        return { text: "Second Hand", className: "bg-gray-500 text-white" }
      case "fair":
        return { text: "Second Hand", className: "bg-gray-500 text-white" }
      case "poor":
        return { text: "Second Hand", className: "bg-gray-500 text-white" }
      default:
        return { text: "Second Hand", className: "bg-gray-500 text-white" }
    }
  }

  const isNegotiable = (priceType: string) => {
    return priceType === "negotiable" || priceType === "contact"
  }

  const formatTimePosted = (createdAt: string) => {
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "1d ago"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return posted.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-foreground">Latest Ads</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <LoadingSkeleton type="card" count={12} />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-2">
              <Button onClick={retry} className="bg-green-600 hover:bg-green-700">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
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
    <section className="py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">Latest Ads</h3>
          <p className="text-sm text-gray-600">{products.length} ads found</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const conditionBadge = getConditionBadge(product.condition)

            return (
              <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
                <Card className="group h-full flex flex-col overflow-hidden border-0 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="relative w-full h-64 overflow-hidden bg-gray-50 rounded-2xl">
                      <img
                        src={product.images?.[0] || "/placeholder.svg?height=300&width=400&query=product"}
                        alt={product.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                          AD{product.id.slice(-8).toUpperCase()}
                        </Badge>
                      </div>

                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <Badge
                          className={`text-xs font-medium px-3 py-1 rounded-full shadow-sm ${conditionBadge.className}`}
                        >
                          {conditionBadge.text}
                        </Badge>

                        {isNegotiable(product.price_type) && (
                          <Badge className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                            Negotiable
                          </Badge>
                        )}
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Toggle favorite"
                        className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm hover:bg-white shadow-md h-10 w-10 p-0 rounded-full border-0"
                        onClick={(e) => toggleFavorite(product.id, e)}
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                          }`}
                        />
                      </Button>
                    </div>

                    <div className="p-3 flex flex-col flex-1 space-y-1">
                      <h4 className="text-lg font-bold text-gray-900 leading-5 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.title}
                      </h4>

                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-green-800">
                          {formatPrice(product.price, product.price_type)}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-gray-700">4.2</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="truncate text-xs font-medium">
                            {product.city}, {product.province}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs font-medium">{formatTimePosted(product.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-8">
            <Button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-sm font-medium rounded-lg"
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
