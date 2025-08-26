"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Clock, Loader2 } from "lucide-react"
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
    return `₹${price.toLocaleString('en-IN')}`
  }

  const formatTimePosted = (createdAt: string) => {
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return "TODAY"
    if (diffInHours < 48) return "YESTERDAY"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} DAYS AGO`
    return posted.toLocaleDateString()
  }

  const formatTitle = (title: string) => {
    return title
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-full flex flex-col overflow-hidden bg-white border border-gray-200 animate-pulse"
            >
              <div className="w-full h-40 bg-gray-200"></div>
              <div className="p-2 flex flex-col flex-1">
                <div className="h-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="flex justify-between mt-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-2 py-4">
        <div className="text-center">
          <p className="text-red-600 mb-3 font-medium">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 text-sm"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-2 py-4">
        <div className="text-center py-4 bg-gray-50 border rounded">
          <p className="text-gray-600 mb-3 font-medium">No ads posted yet. Be the first to post an ad!</p>
          <Link href="/sell" prefetch={false}>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 text-sm">
              Post Your First Ad
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={`/product/${product.id}`} 
            className="block"
            prefetch={false}
          >
            <Card className="h-full flex flex-col overflow-hidden bg-white border border-gray-200 hover:border-green-400 transition-colors">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="relative w-full h-40 overflow-hidden bg-gray-50">
                  <img
                    src={product.images?.[0] || "/placeholder.svg?height=160&width=300"}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Toggle favorite"
                    className="absolute top-1 right-1 bg-white/90 hover:bg-white shadow h-6 w-6 p-0 rounded-full"
                    onClick={(e) => toggleFavorite(product.id, e)}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${
                        favorites.has(product.id) 
                          ? "fill-red-500 text-red-500" 
                          : "text-gray-600"
                      }`}
                    />
                  </Button>

                  {product.featured && (
                    <Badge className="absolute top-1 left-1 bg-green-600 text-white text-xs font-semibold px-1 py-0 rounded">
                      Featured
                    </Badge>
                  )}
                </div>

                <div className="p-2 flex flex-col flex-1">
                  <div className="mb-1">
                    <span className="text-base font-bold text-gray-900">
                      {formatPrice(product.price, product.price_type)}
                    </span>
                  </div>

                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">
                      {formatTitle(product.title)}
                    </h4>
                    {product.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto text-xs text-gray-500">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        {product.city}, {product.province}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{formatTimePosted(product.created_at)}</span>
                      {product.condition && (
                        <span className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {product.condition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-4">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-1 text-sm rounded"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </>
            ) : (
              "Load More Ads"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
