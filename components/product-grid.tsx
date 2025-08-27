"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Loader2, MapPin, Clock, Star } from "lucide-react"
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
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "1d ago"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return posted.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-foreground">Latest Ads</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 15 }).map((_, i) => (
              <Card key={i} className="group overflow-hidden border-0 shadow-sm bg-white rounded-2xl animate-pulse">
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-3/4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
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
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
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
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-foreground">Latest Ads</h3>
          </div>
          <div className="text-center py-12">
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
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-foreground">Latest Ads</h3>
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">{products.length} ads found</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="block group" prefetch={false}>
              <Card className="overflow-hidden border-0 shadow-sm bg-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group-hover:border-green-200">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-2xl">
                    <img
                      src={product.images?.[0] || "/placeholder.svg?height=240&width=320&query=modern product"}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Toggle favorite"
                      className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg h-9 w-9 p-0 rounded-full border-0 hover:scale-110 transition-all duration-200"
                      onClick={(e) => toggleFavorite(product.id, e)}
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors duration-200 ${
                          favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"
                        }`}
                      />
                    </Button>

                    {product.featured && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg border-0 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </Badge>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3">
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(product.price, product.price_type)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 leading-5 line-clamp-2 group-hover:text-green-700 transition-colors duration-200">
                      {product.title}
                    </h4>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate font-medium">
                          {product.city}, {product.province}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTimePosted(product.created_at)}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-0.5 rounded-full border-gray-200 text-gray-600"
                        >
                          {product.condition}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-12">
            <Button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 text-sm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoadingMore ? "Loading more ads..." : "Show More Ads"}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
