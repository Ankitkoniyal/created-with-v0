"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Loader2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
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

  const supabase = createClient()

  const fetchProducts = async (currentPage: number) => {
    const from = currentPage * PRODUCTS_PER_PAGE
    const to = from + PRODUCTS_PER_PAGE - 1

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) {
        console.error("Error fetching products:", error)
        setError("Failed to load ads")
        return null
      }
      return data || []
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to load ads")
      return null
    }
  }

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

  const loadMore = async () => {
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
  }

  const formatPrice = (price: number, priceType: string) => {
    if (priceType === "free") return "Free"
    if (priceType === "contact") return "Contact for Price"
    return `$${price.toLocaleString()}`
  }

  const formatTimePosted = (createdAt: string) => {
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return "1 day ago"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`
    return posted.toLocaleDateString()
  }

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
                className="h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-xl animate-pulse"
              >
                <div className="w-full h-40 sm:h-48 lg:h-52 bg-gray-200"></div>
                <div className="p-3 flex flex-col flex-1">
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
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700">
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

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
              <Card className="group h-full flex flex-col overflow-hidden border border-gray-100 bg-white rounded-xl shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-200">
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Image Section */}
                  <div className="relative w-full h-48 overflow-hidden bg-gray-50">
                    <img
                      src={product.images?.[0] || "/placeholder.svg?height=200&width=300&query=product"}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Favorite Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Toggle favorite"
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white shadow-sm h-8 w-8 p-0 rounded-full"
                      onClick={(e) => toggleFavorite(product.id, e)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                        }`}
                      />
                    </Button>

                    {/* Featured Badge */}
                    {product.featured && (
                      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
                        Featured
                      </Badge>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-3 flex flex-col flex-1">
                    {/* Price */}
                    <p className="text-lg font-bold text-green-600 mb-1">
                      {formatPrice(product.price, product.price_type)}
                    </p>

                    {/* Title */}
                    <h4 className="text-sm font-semibold text-gray-800 leading-5 line-clamp-2 mb-2">
                      {product.title}
                    </h4>

                    {/* Location & Time */}
                    <div className="text-xs text-gray-500 mt-auto space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="truncate">{product.city}, {product.province}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimePosted(product.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Load More */}
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
