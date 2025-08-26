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
  rating?: number
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

  const formatTitleSentenceCase = (title: string) => {
    if (!title) return ""
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()
  }

  const renderStars = (rating: number = 4.5) => {
    const fullStars = Math.floor(rating)
    const halfStar = rating % 1 >= 0.5
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : halfStar && i === fullStars
                ? "fill-yellow-300 text-yellow-300"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <section className="py-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-foreground">Latest Ads</h3>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="h-full animate-pulse bg-gray-100 rounded-xl"></Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-0">
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

  return (
    <section className="py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
        {/* Ads Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-foreground">Latest Ads</h3>
            <p className="text-sm text-gray-600">{products.length} ads found</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} prefetch={false}>
                <Card className="group h-full flex flex-col overflow-hidden border border-gray-100 bg-white rounded-xl shadow-sm hover:shadow-lg transition">
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Image */}
                    <div className="relative w-full h-48 overflow-hidden bg-gray-50">
                      <img
                        src={product.images?.[0] || "/placeholder.svg"}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-3 right-3 bg-white/90 rounded-full h-8 w-8"
                        onClick={(e) => toggleFavorite(product.id, e)}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                          }`}
                        />
                      </Button>
                      {product.featured && (
                        <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                          Featured
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-lg font-bold text-green-600 mb-1">
                        {formatPrice(product.price, product.price_type)}
                      </p>
                      <h4 className="text-sm font-semibold text-gray-800 leading-5 line-clamp-2 mb-1">
                        {formatTitleSentenceCase(product.title)}
                      </h4>

                      {/* Stars */}
                      <div className="mb-2">{renderStars(product.rating || 4.5)}</div>

                      {/* Location + Time */}
                      <div className="text-xs text-gray-500 mt-auto space-y-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{product.city}, {product.province}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>{formatTimePosted(product.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <Button onClick={loadMore} disabled={isLoadingMore} className="bg-green-600 hover:bg-green-700">
                {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLoadingMore ? "Loading..." : "Show More"}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar Ad Space */}
        <aside className="hidden lg:block w-64">
          <div className="sticky top-20">
            <img src="/long-vertical-ad.png" alt="Sidebar Ad" className="w-full rounded-xl shadow" />
          </div>
        </aside>
      </div>
    </section>
  )
}
