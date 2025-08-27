"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Product {
  id: string
  title: string
  price: number
  location: string
  city: string
  province: string
  images: string[] // Fixed field name from image_urls to images to match database schema
  category: string
  condition: string
  created_at: string
  views?: number
}

export function LatestAds() {
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
          .limit(5)

        if (error) {
          console.error("Error fetching latest ads:", error)
        } else {
          setProducts(data || [])
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestAds()
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

  const formatTimePosted = (createdAt: string) => {
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "1d ago"
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  if (loading) {
    return (
      <section className="py-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Latest Ads</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 aspect-square rounded-2xl mb-3"></div>
                <div className="space-y-2">
                  <div className="bg-gray-200 h-4 rounded-lg"></div>
                  <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Latest Ads</h2>
          </div>
          <p className="text-gray-500 text-center py-12">No ads available at the moment.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Latest Ads</h2>
          <Link
            href="/search"
            className="text-green-600 hover:text-green-700 font-semibold text-sm bg-green-50 px-4 py-2 rounded-full hover:bg-green-100 transition-colors duration-200"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="block group">
              <Card className="overflow-hidden border-0 shadow-sm bg-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group-hover:border-green-200">
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-2xl">
                    <img
                      src={product.images?.[0] || "/placeholder.svg?height=200&width=200&query=modern product"} // Updated from image_urls to images
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg h-8 w-8 p-0 rounded-full border-0 hover:scale-110 transition-all duration-200"
                      onClick={(e) => toggleFavorite(product.id, e)}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 transition-colors duration-200 ${
                          favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"
                        }`}
                      />
                    </Button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
                        <p className="text-sm font-bold text-green-600 text-center">
                          ${product.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-green-700 transition-colors duration-200">
                      {product.title}
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="truncate font-medium">
                          {product.city && product.province
                            ? `${product.city}, ${product.province}`
                            : product.location?.split(",").slice(-2).join(",").trim() || product.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
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
      </div>
    </section>
  )
}
