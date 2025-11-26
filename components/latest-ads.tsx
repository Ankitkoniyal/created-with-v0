"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getOptimizedImageUrl } from "@/lib/images"
import Image from "next/image"
import { formatLocation, formatLocationString } from "@/lib/location-utils"
import { useAuth } from "@/hooks/use-auth"

interface Product {
  id: string
  title: string
  price: number
  location: string
  city: string
  province: string
  image_urls: string[]
  category: string
  condition: string
  created_at: string
  views?: number
  user_id?: string
}

export function LatestAds() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchLatestAds = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(8) // Show more ads in compact view

        if (error) {
          // Silently handle error, show fallback UI
        } else {
          setProducts(data || [])
        }
      } catch (err) {
        // Silently handle error
      } finally {
        setLoading(false)
      }
    }

    fetchLatestAds()
  }, [])

  // Load user favorites
  useEffect(() => {
    async function loadFavorites() {
      if (!user) {
        setFavorites(new Set())
        return
      }
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("favorites")
          .select("product_id")
          .eq("user_id", user.id)
        
        if (!error && data) {
          setFavorites(new Set(data.map(f => f.product_id)))
        }
      } catch (err) {
        console.error("Failed to load favorites:", err)
      }
    }
    loadFavorites()
  }, [user])

  const toggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      return
    }
    
    const isCurrentlyFavorite = favorites.has(productId)
    
    // Optimistically update UI
    setFavorites((prev) => {
      const next = new Set(prev)
      if (isCurrentlyFavorite) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
    
    try {
      const supabase = createClient()
      if (isCurrentlyFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id: productId })
      }
    } catch (err) {
      // Revert on error
      setFavorites((prev) => {
        const next = new Set(prev)
        if (isCurrentlyFavorite) {
          next.add(productId)
        } else {
          next.delete(productId)
        }
        return next
      })
      console.error("Failed to toggle favorite:", err)
    }
  }

  if (loading) {
    return (
      <section className="py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Latest Ads</h2>
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-sm mb-1"></div>
                <div className="bg-gray-200 h-3 rounded-sm mb-1"></div>
                <div className="bg-gray-200 h-3 rounded-sm w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Latest Ads</h2>
          </div>
          <p className="text-gray-500 text-center py-4 text-sm">No ads available at the moment.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-6 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Latest Ads</h2>
          <Link href="/search" className="text-sm text-primary hover:text-primary/80 font-medium">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="group">
              <Card className="cursor-pointer hover:shadow-md transition-all duration-200 h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-sm">
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Image Container */}
                  <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                    <Image
                      src={
                        getOptimizedImageUrl(product.image_urls?.[0], "thumb") ||
                        "/placeholder.svg"
                      }
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12.5vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    
                    {/* Wishlist Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`absolute top-1 right-1 shadow-xs p-1 h-6 w-6 z-10 rounded-sm ${
                        favorites.has(product.id)
                          ? "bg-white/90 text-red-500"
                          : "bg-white/80 hover:bg-white text-gray-600"
                      }`}
                      onClick={(e) => toggleFavorite(product.id, e)}
                    >
                      <Heart className={`h-3 w-3 ${favorites.has(product.id) ? "fill-current" : ""}`} />
                    </Button>
                    
                    {/* Price Badge */}
                    <div className="absolute bottom-1 left-1 bg-black/80 text-white px-1.5 py-0.5 rounded-sm">
                      <span className="text-xs font-bold">${product.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-1.5 flex flex-col flex-1 bg-white min-h-0">
                    <h4 className="text-xs text-gray-800 leading-tight line-clamp-1 mb-1 font-medium group-hover:text-primary transition-colors truncate min-h-[1rem]">
                      {product.title}
                    </h4>

                    <div className="mt-auto space-y-1">
                      {/* Location */}
                      <div className="flex items-center gap-1 text-xs text-gray-600 min-h-[1rem]">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {product.city && product.province
                            ? formatLocation(product.city, product.province)
                            : product.location
                              ? formatLocationString(product.location)
                              : "Location not specified"}
                        </span>
                      </div>
                      
                      {/* Posted Time */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 min-h-[1rem]">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate whitespace-nowrap">
                          {(() => {
                            const now = new Date()
                            const posted = new Date(product.created_at)
                            const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))
                            const diffInDays = Math.floor(diffInHours / 24)
                            
                            if (diffInHours < 1) return "Now"
                            if (diffInHours < 24) return `${diffInHours}h ago`
                            if (diffInDays === 1) return "1 day ago"
                            if (diffInDays < 7) return `${diffInDays} days ago`
                            return posted.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
