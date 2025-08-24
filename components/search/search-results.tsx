"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Eye, Grid3X3, List, Package, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useDebounce } from "@/hooks/use-debounce"

interface Product {
  id: string
  title: string
  price: number
  location: string
  city: string
  province: string
  image_urls: string[]
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

  const category = filters.category
  const subcategory = filters.subcategory
  const minPrice = filters.minPrice
  const maxPrice = filters.maxPrice
  const condition = filters.condition
  const location = filters.location
  const sortBy = filters.sortBy

  // Debounce search query to prevent too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const fetchProducts = useCallback(async () => {
    console.log("[v0] Fetching products from database...")
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      let query = supabase.from("products").select("*").order("created_at", { ascending: false })

      if (debouncedSearchQuery) {
        query = query.or(
          `title.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%,category.ilike.%${debouncedSearchQuery}%`,
        )
      }

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

      if (subcategory && subcategory !== "all") {
        query = query.eq("category", subcategory)
      } else if (category) {
        const subcategories = categoryMapping[category] || []
        if (subcategories.length > 0) {
          query = query.in("category", subcategories)
        }
      }

      const minPriceNum = Number.parseInt(minPrice) || 0
      const maxPriceNum = Number.parseInt(maxPrice) || Number.MAX_SAFE_INTEGER

      if (minPriceNum > 0) {
        query = query.gte("price", minPriceNum)
      }
      if (maxPriceNum < Number.MAX_SAFE_INTEGER) {
        query = query.lte("price", maxPriceNum)
      }

      if (condition) {
        query = query.eq("condition", condition.toLowerCase())
      }

      if (location) {
        query = query.or(`city.ilike.%${location}%,province.ilike.%${location}%,location.ilike.%${location}%`)
      }

      switch (sortBy) {
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
        console.error("[v0] Error fetching products:", fetchError)
        setError("Failed to load products. Please try again.")
      } else {
        console.log("[v0] Fetched products:", data?.length || 0)
        setProducts(data || [])
      }
    } catch (err) {
      console.error("[v0] Search error:", err)
      setError("An error occurred while searching. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchQuery, category, subcategory, minPrice, maxPrice, condition, location, sortBy]) // Use individual filter values instead of JSON.stringify(filters)

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = useMemo(() => {
    return products
  }, [products])

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
          <Button onClick={fetchProducts} className="bg-green-800 hover:bg-green-900">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (filteredProducts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <Button asChild className="bg-green-800 hover:bg-green-900">
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
          {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} found
          {debouncedSearchQuery && ` for "${debouncedSearchQuery}"`}
          {subcategory && subcategory !== "all" && ` in ${subcategory}`}
          {!subcategory && category && ` in ${category}`}
        </p>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={
              viewMode === "grid" ? "bg-green-800 hover:bg-green-900" : "hover:bg-green-100 hover:text-green-700"
            }
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={
              viewMode === "list" ? "bg-green-800 hover:bg-green-900" : "hover:bg-green-100 hover:text-green-700"
            }
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {filteredProducts.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} prefetch={false}>
            <Card
              className={`group cursor-pointer hover:shadow-lg hover:bg-green-50 hover:border-green-200 transition-all duration-300 ${
                viewMode === "list" ? "flex" : ""
              }`}
            >
              <CardContent className={`p-0 ${viewMode === "list" ? "flex" : ""}`}>
                <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                  <img
                    src={product.image_urls?.[0] || "/placeholder.svg"}
                    alt={product.title}
                    width={viewMode === "list" ? 192 : 300}
                    height={viewMode === "list" ? 128 : 192}
                    className={`object-cover ${
                      viewMode === "list" ? "w-full h-32" : "w-full h-48"
                    } ${viewMode === "grid" ? "rounded-t-lg" : "rounded-l-lg"}`}
                    loading="lazy"
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
