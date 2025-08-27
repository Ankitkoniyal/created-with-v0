"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Product {
  id: string
  title: string
  price: number
  city: string
  province: string
  location: string
  images: string[] // Fixed field name from image_urls to images to match database schema
  category: string
}

interface RelatedProductsProps {
  currentProductId: string
  category: string
}

export function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const supabase = createClient()

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("category", category)
          .neq("id", currentProductId)
          .limit(3)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Error fetching related products:", error.message)
        } else {
          console.log("[v0] Fetched related products:", data?.length || 0)
          setRelatedProducts(data || [])
        }
      } catch (error) {
        console.error("[v0] Error fetching related products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [currentProductId, category])

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(productId) ? next.delete(productId) : next.add(productId)
      return next
    })
  }

  if (loading) {
    return (
      <section className="mt-16">
        <h2 className="text-3xl font-bold text-foreground mb-8">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-0 shadow-sm rounded-2xl">
              <CardContent className="p-0">
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-2xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded-lg w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (relatedProducts.length === 0) {
    return null
  }

  return (
    <section className="mt-16">
      <h2 className="text-3xl font-bold text-foreground mb-8">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedProducts.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} className="block group">
            <Card className="overflow-hidden border-0 shadow-sm bg-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group-hover:border-green-200">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-2xl">
                  <img
                    src={product.images?.[0] || "/placeholder.svg?height=240&width=320&query=modern product"} // Updated from image_urls to images
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg h-9 w-9 p-0 rounded-full border-0 hover:scale-110 transition-all duration-200"
                    onClick={(e) => toggleFavorite(product.id, e)}
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors duration-200 ${
                        favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"
                      }`}
                    />
                  </Button>
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                      <p className="text-lg font-bold text-green-600">${product.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors duration-200 leading-5">
                    {product.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {product.city && product.province ? `${product.city}, ${product.province}` : product.location}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
