"use client"

import { useState } from "react"
import { useDeepCompareEffect } from "@/hooks/use-deep-compare-effect"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Eye, Grid3X3, List, Package, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getCategoryMapping } from "@/lib/categories"
import Image from "next/image"
import { getOptimizedImageUrl } from "@/lib/images"

interface Product {
  id: string
  title: string
  price: number
  location: string
  city: string
  province: string
  images: string[] // Fixed field name from image_urls to images to match database schema
  category_id: number
  category: string
  condition: string
  status: string
  views?: number
  created_at: string
  user_id: string
  description: string
}

interface SearchResultsProps {
  searchQuery: string
  filters: {
    category: string
    subcategory: string
    minPrice: string
    maxPrice: string
    condition: string
    location: string
    sortBy: string
    [key: string]: string
  }
}

export function SearchResults({ searchQuery, filters }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useDeepCompareEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        let query = supabase.from("products").select("*").order("created_at", { ascending: false })

        if (searchQuery) {
          query = query.or(
            `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`,
          )
        }

        if (filters.subcategory && filters.subcategory !== "all") {
          query = query.eq("category", filters.subcategory)
        } else if (filters.category) {
          const categoryMapping = getCategoryMapping()
          const subcategories = categoryMapping[filters.category] || []
          if (subcategories.length > 0) {
            query = query.in("category", subcategories)
          }
        }

        const minPrice = Number.parseInt(filters.minPrice) || 0
        const maxPrice = Number.parseInt(filters.maxPrice) || Number.MAX_SAFE_INTEGER

        if (minPrice > 0) {
          query = query.gte("price", minPrice)
        }
        if (maxPrice < Number.MAX_SAFE_INTEGER) {
          query = query.lte("price", maxPrice)
        }

        if (filters.condition && filters.condition !== "all") {
          query = query.eq("condition", filters.condition.toLowerCase())
        }

        if (filters.location) {
          const raw = filters.location.trim()

          if (raw.includes(",")) {
            const [cityPart, provincePart] = raw.split(",").map((s) => s.trim())
            if (cityPart) {
              query = query.ilike("city", `%${cityPart}%`)
            }
            if (provincePart) {
              query = query.ilike("province", `%${provincePart}%`)
            }
          } else {
            const safe = raw.replace(/[()]/g, "") // guard against parentheses affecting the logic parser
            query = query.or(`city.ilike.%${safe}%,province.ilike.%${safe}%,location.ilike.%${safe}%`)
          }
        }

        switch (filters.sortBy) {
          case "newest":
            query = query.order("created_at", { ascending: false })
            break
          case "price-low":
            query = query.order("price", { ascending: true })
            break
          case "price-high":
            query = query.order("price", { ascending: false })
            break
          case "distance":
            query = query.order("city", { ascending: true })
            break
          default:
            query = query.order("created_at", { ascending: false })
        }

        const { data, error: fetchError } = await query.limit(50)

        if (fetchError) {
          console.error("Error fetching products:", fetchError)
          setError("Failed to load products. Please try again.")
        } else {
          setProducts(data || [])
        }
      } catch (err) {
        console.error("Search error:", err)
        setError("An error occurred while searching. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [searchQuery, filters]) // Simplified dependencies - let useDeepCompareEffect handle the deep comparison

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Searching...</h3>
          <p className="text-muted-foreground">Finding the best products for you</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Search Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-green-900 hover:bg-green-950">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <Button asChild className="bg-green-900 hover:bg-green-950">
            <Link href="/search">Clear Search</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {products.length} result{products.length !== 1 ? "s" : ""} found
          {searchQuery && ` for "${searchQuery}"`}
          {filters.subcategory && filters.subcategory !== "all" && ` in ${filters.subcategory}`}
          {!filters.subcategory && filters.category && ` in ${filters.category}`}
        </p>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={
              viewMode === "grid" ? "bg-green-900 hover:bg-green-950" : "hover:bg-green-100 hover:text-green-700"
            }
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={
              viewMode === "list" ? "bg-green-900 hover:bg-green-950" : "hover:bg-green-100 hover:text-green-700"
            }
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {products.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} prefetch={false}>
            <Card
              className={`group cursor-pointer hover:shadow-lg hover:bg-green-50 hover:border-green-200 transition-all duration-300 ${
                viewMode === "list" ? "flex" : ""
              }`}
            >
              <CardContent className={`p-0 ${viewMode === "list" ? "flex" : ""}`}>
                <div className={`relative ${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "h-48"}`}>
                  <Image
                    src={getOptimizedImageUrl(product.images?.[0], "thumb") || "/placeholder.svg"}
                    alt={product.title}
                    fill
                    sizes={viewMode === "list" ? "192px" : "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 33vw"}
                    className={`object-cover ${viewMode === "grid" ? "rounded-t-lg" : "rounded-l-lg"}`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-green-100 hover:text-green-700"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <h4 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-green-800">
                    {product.title}
                  </h4>
                  <p className="text-2xl font-bold text-primary mb-2">${product.price.toLocaleString()}</p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span className="capitalize">{product.condition}</span>
                    <span>{product.category}</span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {product.city && product.province ? `${product.city}, ${product.province}` : product.location}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {product.views || 0} views
                    </div>
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
