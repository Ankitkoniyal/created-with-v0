"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"
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

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [visibleCount, setVisibleCount] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchProducts = async () => {
    try {
      console.log("[v0] Fetching products from database...")
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(visibleCount)

      if (error) {
        console.error("[v0] Error fetching products:", error)
        setError("Failed to load ads")
        return
      }

      console.log("[v0] Fetched products:", data?.length || 0)
      setProducts(data || [])
      setError(null)
    } catch (err) {
      console.error("[v0] Error fetching products:", err)
      setError("Failed to load ads")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [visibleCount])

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
    setIsLoadingMore(true)
    const newVisibleCount = visibleCount + 12

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(newVisibleCount)

      if (error) {
        console.error("[v0] Error loading more products:", error)
        return
      }

      setProducts(data || [])
      setVisibleCount(newVisibleCount)
    } catch (err) {
      console.error("[v0] Error loading more products:", err)
    } finally {
      setIsLoadingMore(false)
    }
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
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchProducts} className="bg-green-600 hover:bg-green-700">
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
            <Link href="/sell">
              <Button className="bg-green-600 hover:bg-green-700">Post Your First Ad</Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const hasMore = products.length >= visibleCount

  return (
    <section className="py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-foreground">Latest Ads</h3>
          <p className="text-sm text-gray-600">{products.length} ads found</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="block">
              <Card className="group h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-md hover:shadow-md transition-all duration-150">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative w-full h-40 sm:h-48 lg:h-52 overflow-hidden bg-gray-50">
                    <img
                      src={product.images?.[0] || "/placeholder.svg?height=200&width=200&query=product"}
                      alt={product.title}
                      loading="lazy"
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
              {isLoadingMore ? "Loading..." : "Show More"}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
