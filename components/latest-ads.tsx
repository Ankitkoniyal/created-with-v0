"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getOptimizedImageUrl } from "@/lib/images"
import Image from "next/image"

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
}

export function LatestAds() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

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
                      className="absolute top-1 right-1 bg-white/80 hover:bg-white shadow-xs p-1 h-6 w-6 z-10 rounded-sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Add to wishlist functionality here
                      }}
                    >
                      <Heart className="h-3 w-3 text-gray-600" />
                    </Button>
                    
                    {/* Price Badge */}
                    <div className="absolute bottom-1 left-1 bg-black/80 text-white px-1.5 py-0.5 rounded-sm">
                      <span className="text-xs font-bold">${product.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-1.5 flex flex-col flex-1 bg-white">
                    <h4 className="text-xs text-gray-800 leading-tight line-clamp-2 mb-1 font-medium group-hover:text-primary transition-colors">
                      {product.title}
                    </h4>

                    <div className="mt-auto space-y-1">
                      {/* Location */}
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {product.city && product.province
                            ? `${product.city}, ${product.province}`
                            : product.location?.split(",").slice(-2).join(",").trim() || product.location}
                        </span>
                      </div>
                      
                      {/* Posted Time */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(product.created_at).toLocaleDateString()}
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
