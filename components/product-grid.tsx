"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Loader2, MapPin, Clock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import useSWRInfinite from "swr/infinite"
import Image from "next/image"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { getOptimizedImageUrl } from "@/lib/images"

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

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    title: "iPhone 13 - Good Condition",
    price: 599,
    price_type: "fixed",
    location: "Toronto",
    city: "Toronto",
    province: "Ontario",
    condition: "like new",
    category: "Electronics",
    description: "Excellent condition iPhone 13",
    images: ["/modern-smartphone.png"],
    created_at: new Date().toISOString(),
    user_id: "user1",
  },
  {
    id: "2",
    title: "Dining Table Set - Oak Wood",
    price: 350,
    price_type: "negotiable",
    location: "Vancouver",
    city: "Vancouver",
    province: "British Columbia",
    condition: "new",
    category: "Furniture",
    description: "Beautiful oak dining table",
    images: ["/elegant-dining-table.png"],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: "user2",
  },
  {
    id: "3",
    title: "Samsung Galaxy S23 Ultra",
    price: 750,
    price_type: "fixed",
    location: "Calgary",
    city: "Calgary",
    province: "Alberta",
    condition: "like new",
    category: "Electronics",
    description: "Latest Samsung flagship phone",
    images: ["/samsung-smartphone.png"],
    created_at: new Date(Date.now() - 172800000).toISOString(),
    user_id: "user3",
  },
  {
    id: "4",
    title: "MacBook Air M2 - Like New",
    price: 1100,
    price_type: "negotiable",
    location: "Montreal",
    city: "Montreal",
    province: "Quebec",
    condition: "like new",
    category: "Electronics",
    description: "Barely used MacBook Air",
    images: ["/macbook.png"],
    created_at: new Date(Date.now() - 259200000).toISOString(),
    user_id: "user4",
  },
  {
    id: "5",
    title: "Sectional Couch - Grey",
    price: 800,
    price_type: "fixed",
    location: "Ottawa",
    city: "Ottawa",
    province: "Ontario",
    condition: "new",
    category: "Furniture",
    description: "Comfortable sectional sofa",
    images: ["/sectional-couch.png"],
    created_at: new Date(Date.now() - 345600000).toISOString(),
    user_id: "user5",
  },
]

export function ProductGrid({ products: overrideProducts }: { products?: Product[] }) {
  const [productsState, setProductsState] = useState<Product[]>([]) // kept for compatibility; no longer primary source
  const [page, setPage] = useState(0)
  const [hasMoreState, setHasMoreState] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [shouldFetch, setShouldFetch] = useState(false)

  const hasOverride = Array.isArray(overrideProducts)
  const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json())

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

  const swrEnabled = !hasOverride && shouldFetch

  const getKey = (index: number, prev: any) => {
    if (!swrEnabled) return null
    if (index === 0) return `/api/products?limit=${PRODUCTS_PER_PAGE}`
    if (!prev?.next) return null
    const n = prev.next
    return `/api/products?limit=${PRODUCTS_PER_PAGE}&afterCreatedAt=${encodeURIComponent(
      n.afterCreatedAt,
    )}&afterId=${encodeURIComponent(n.afterId)}`
  }

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
  })

  const isLoading = swrEnabled && !data && !error
  const productsFetched: Product[] = (data ? data.flatMap((p: any) => p?.products || []) : []) as Product[]
  const productsToRender: Product[] = hasOverride ? (overrideProducts as Product[]) : productsFetched
  const hasMore = swrEnabled ? Boolean(data && data[data.length - 1]?.next) : false
  const isLoadingMore = swrEnabled && isValidating && !!data

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
    if (priceType === "contact") return "Contact for Price"
    if (typeof price === "number") return `$${price.toLocaleString()}`
    return "Contact for Price"
  }

  const getConditionBadge = (condition?: string) => {
    switch (condition?.toLowerCase()) {
      case "new":
        return { text: "New", className: "bg-green-500 text-white" }
      case "like new":
        return { text: "Like New", className: "bg-green-400 text-white" }
      default:
        return null
    }
  }

  const isNegotiable = (priceType?: string) => {
    return priceType === "negotiable" || priceType === "contact"
  }

  const formatTimePosted = (createdAt?: string) => {
    if (!createdAt) return ""
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "1d ago"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return posted.toLocaleDateString()
  }

  if (!hasOverride && !shouldFetch) {
    return null
  }

  if (isLoading) {
    return (
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-foreground">Latest Ads</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <LoadingSkeleton type="card" count={15} />
          </div>
        </div>
      </section>
    )
  }

  if (!hasOverride && error) {
    return (
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Ads</h3>
            <p className="text-gray-600 mb-6">We're having trouble fetching ads. Please try again.</p>
            <div className="space-x-3">
              <Button onClick={() => mutate()} className="bg-green-900 hover:bg-green-950">
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

  if (productsToRender.length === 0) {
    return (
      <section className="py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Ads Found</h3>
            <p className="text-gray-600 mb-6">Be the first to post an ad in your area!</p>
            <Button asChild className="bg-green-900 hover:bg-green-950">
              <Link href="/post">Post Your First Ad</Link>
            </Button>
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
          <p className="text-sm text-gray-600">{productsToRender.length} ads found</p>
        </div>

        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {productsToRender.map((product) => {
              const conditionBadge = getConditionBadge(product.condition)
              const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
              const optimizedPrimary = getOptimizedImageUrl(primaryImage, "card") || primaryImage
              const provinceOrLocation = product.province || product.location || ""

              return (
                <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
                  <Card className="group h-full flex flex-col overflow-hidden border-0 bg-white rounded-xl shadow-sm">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="relative w-full aspect-square overflow-hidden bg-gray-50 rounded-xl">
                        <Image
                          src={optimizedPrimary || "/placeholder.svg"}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {conditionBadge && (
                            <Badge
                              className={`text-xs font-medium px-3 py-1 rounded-full shadow-sm ${conditionBadge.className}`}
                            >
                              {conditionBadge.text}
                            </Badge>
                          )}

                          {isNegotiable(product.price_type) && (
                            <Badge className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                              Negotiable
                            </Badge>
                          )}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
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
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{favorites.has(product.id) ? "Remove from favorites" : "Add to favorites"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="p-3 flex flex-col flex-1 space-y-1">
                        <h4 className="text-base font-semibold text-gray-900 leading-5 line-clamp-2">
                          {product.title}
                        </h4>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-green-800">
                            {formatPrice(product.price as any, (product as any).price_type)}
                          </p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-1 cursor-help">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-semibold text-gray-700">4.2</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Seller rating (4.2/5 stars)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="truncate text-xs font-medium">{provinceOrLocation}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Item location</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-gray-400 cursor-help">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs font-medium">
                                  {formatTimePosted(product.created_at as any)}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Posted on {product.created_at ? new Date(product.created_at).toLocaleDateString() : "—"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </TooltipProvider>

        {hasMore && (
          <div className="text-center mt-8">
            <Button
              onClick={() => setSize(size + 1)}
              disabled={isLoadingMore}
              className="bg-green-900 hover:bg-green-950 text-white px-8 py-3 text-sm font-medium rounded-lg"
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
