"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getOptimizedImageUrl } from "@/lib/images"

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

  if (loading) {
    return (
      <section className="py-4 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Latest Ads</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded mb-1"></div>
                <div className="bg-gray-200 h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-4 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Latest Ads</h2>
          </div>
          <p className="text-gray-500 text-center py-8">No ads available at the moment.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-4 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Latest Ads</h2>
          <Link href="/search" className="text-primary hover:text-primary/80 font-medium">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 h-full flex flex-col overflow-hidden border border-gray-300 bg-white rounded-none">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={
                        getOptimizedImageUrl(product.image_urls?.[0], "thumb") ||
                        "/placeholder.svg?height=400&width=400&query=latest%20ad" ||
                        "/placeholder.svg"
                      }
                      alt={product.title}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 bg-white hover:bg-gray-50 shadow-sm p-1 h-6 w-6 z-10 rounded-none"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <Heart className="h-3 w-3 text-gray-600" />
                    </Button>
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-none">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-black">${product.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 flex flex-col flex-1 bg-white">
                    <h4 className="text-xs text-gray-800 leading-tight line-clamp-2 mb-1 font-medium">
                      {product.title}
                    </h4>

                    <div className="mt-auto space-y-0.5">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">
                          {product.city && product.province
                            ? `${product.city}, ${product.province}`
                            : product.location?.split(",").slice(-2).join(",").trim() || product.location}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        {new Date(product.created_at).toLocaleDateString()}
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
