"use client"

import type React from "react"

import { useState } from "react"
import { useDeepCompareEffect } from "@/hooks/use-deep-compare-effect"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Eye, Grid3X3, List, Package, Loader2, Clock } from "lucide-react"
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
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

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
          const categoryMapping: Record<string, string[]> = {
            Vehicles: [
              "Cars",
              "Motorcycles",
              "Trucks",
              "Buses",
              "Bicycles",
              "Scooters",
              "Boats",
              "RVs",
              "ATVs",
              "Parts & Accessories",
            ],
            Electronics: [
              "TV",
              "Fridge",
              "Oven",
              "AC",
              "Cooler",
              "Toaster",
              "Fan",
              "Washing Machine",
              "Microwave",
              "Computer",
              "Laptop",
              "Camera",
              "Audio System",
            ],
            Mobile: [
              "Smartphones",
              "Tablets",
              "Accessories",
              "Cases & Covers",
              "Chargers",
              "Headphones",
              "Smart Watches",
              "Power Banks",
            ],
            "Real Estate": [
              "Houses",
              "Apartments",
              "Commercial",
              "Land",
              "Rental",
              "Vacation Rentals",
              "Office Space",
              "Warehouse",
            ],
            Fashion: [
              "Men's Clothing",
              "Women's Clothing",
              "Kids Clothing",
              "Shoes",
              "Bags",
              "Jewelry",
              "Watches",
              "Accessories",
            ],
            Pets: ["Dogs", "Cats", "Birds", "Fish", "Pet Food", "Pet Accessories", "Pet Care", "Pet Services"],
            Furniture: ["Sofa", "Bed", "Table", "Chair", "Wardrobe", "Desk", "Cabinet", "Dining Set", "Home Decor"],
            Jobs: ["Full Time", "Part Time", "Freelance", "Internship", "Remote Work", "Contract", "Temporary"],
            Gaming: ["Video Games", "Consoles", "PC Gaming", "Mobile Games", "Gaming Accessories", "Board Games"],
            Books: ["Fiction", "Non-Fiction", "Educational", "Comics", "Magazines", "E-books", "Audiobooks"],
            Services: [
              "Home Services",
              "Repair",
              "Cleaning",
              "Tutoring",
              "Photography",
              "Event Planning",
              "Transportation",
            ],
            Other: [
              "Sports Equipment",
              "Musical Instruments",
              "Art & Crafts",
              "Collectibles",
              "Tools",
              "Garden",
              "Baby Items",
            ],
          }
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
          query = query.or(
            `city.ilike.%${filters.location}%,province.ilike.%${filters.location}%,location.ilike.%${filters.location}%`,
          )
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
  }, [searchQuery, filters])

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
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return posted.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-green-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Searching...</h3>
          <p className="text-muted-foreground">Finding the best products for you</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Search Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700 rounded-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <Button asChild className="bg-green-600 hover:bg-green-700 rounded-full">
            <Link href="/search">Clear Search</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border-0">
        <div>
          <p className="text-gray-600 font-medium">
            {products.length} result{products.length !== 1 ? "s" : ""} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
          {(filters.subcategory && filters.subcategory !== "all") || filters.category ? (
            <p className="text-sm text-gray-500 mt-1">
              in {filters.subcategory && filters.subcategory !== "all" ? filters.subcategory : filters.category}
            </p>
          ) : null}
        </div>

        <div className="flex items-center bg-gray-50 rounded-full p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={`rounded-full h-9 w-9 p-0 ${
              viewMode === "grid"
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={`rounded-full h-9 w-9 p-0 ${
              viewMode === "list"
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={
          viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
        }
      >
        {products.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} prefetch={false} className="block group">
            <Card
              className={`overflow-hidden border-0 shadow-sm bg-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group-hover:border-green-200 ${
                viewMode === "list" ? "flex" : ""
              }`}
            >
              <CardContent className={`p-0 ${viewMode === "list" ? "flex w-full" : ""}`}>
                <div
                  className={`relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 ${
                    viewMode === "list" ? "w-48 flex-shrink-0 aspect-[4/3]" : "aspect-[4/3]"
                  } ${viewMode === "grid" ? "rounded-t-2xl" : "rounded-l-2xl"}`}
                >
                  <img
                    src={product.images?.[0] || "/placeholder.svg?height=240&width=320&query=modern product"} // Updated from image_urls to images
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
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

                  {viewMode === "grid" && (
                    <div className="absolute bottom-3 left-3">
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                        <p className="text-lg font-bold text-green-600">${product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`p-4 space-y-3 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors duration-200 leading-5">
                      {product.title}
                    </h4>

                    {viewMode === "list" && (
                      <p className="text-2xl font-bold text-green-600">${product.price.toLocaleString()}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-1 rounded-full border-gray-200 text-gray-600 capitalize"
                      >
                        {product.condition}
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {product.category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {product.city && product.province ? `${product.city}, ${product.province}` : product.location}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{product.views || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatTimePosted(product.created_at)}</span>
                      </div>
                    </div>
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
