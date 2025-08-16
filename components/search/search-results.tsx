"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Eye, Grid3X3, List, Package } from "lucide-react"
import Link from "next/link"

// Mock products data - in a real app, this would come from an API
const allProducts = [
  {
    id: "1",
    title: "iPhone 14 Pro Max - Excellent Condition",
    price: 899,
    location: "New York, NY",
    image: "/iphone-14-pro-max.png",
    category: "Mobile",
    subcategory: "Smartphones",
    primary_category: "Smartphones", // This is the main identifier for filtering
    condition: "Excellent",
    featured: true,
    views: 156,
    postedDate: "2024-01-15",
  },
  {
    id: "2",
    title: "2019 Honda Civic - Low Mileage",
    price: 18500,
    location: "Los Angeles, CA",
    image: "/honda-civic.png",
    category: "Vehicles",
    subcategory: "Cars",
    primary_category: "Cars",
    condition: "Very Good",
    featured: false,
    views: 89,
    postedDate: "2024-01-10",
  },
  {
    id: "3",
    title: "Modern Sofa Set - Like New",
    price: 650,
    location: "Chicago, IL",
    image: "/modern-sofa.png",
    category: "Furniture",
    subcategory: "Sofa",
    primary_category: "Sofa",
    condition: "Like New",
    featured: true,
    views: 45,
    postedDate: "2024-01-12",
  },
  {
    id: "4",
    title: "Gaming Laptop - RTX 3070",
    price: 1200,
    location: "Austin, TX",
    image: "/placeholder-mvtsk.png",
    category: "Electronics",
    subcategory: "Laptop",
    primary_category: "Laptop",
    condition: "Good",
    featured: false,
    views: 78,
    postedDate: "2024-01-08",
  },
  {
    id: "5",
    title: "Vintage Leather Jacket",
    price: 85,
    location: "Miami, FL",
    image: "/vintage-leather-jacket.png",
    category: "Fashion",
    subcategory: "Men's Clothing",
    primary_category: "Men's Clothing",
    condition: "Good",
    featured: false,
    views: 34,
    postedDate: "2024-01-14",
  },
  {
    id: "6",
    title: "Mountain Bike - Trek 2021",
    price: 450,
    location: "Denver, CO",
    image: "/trek-mountain-bike.png",
    category: "Other",
    subcategory: "Sports Equipment",
    primary_category: "Sports Equipment",
    condition: "Very Good",
    featured: true,
    views: 67,
    postedDate: "2024-01-11",
  },
  {
    id: "7",
    title: "MacBook Air M2 - 2022",
    price: 999,
    location: "San Francisco, CA",
    image: "/placeholder.svg",
    category: "Electronics",
    subcategory: "Laptop",
    primary_category: "Laptop",
    condition: "Excellent",
    featured: false,
    views: 123,
    postedDate: "2024-01-13",
  },
  {
    id: "8",
    title: "Designer Handbag - Authentic",
    price: 320,
    location: "New York, NY",
    image: "/placeholder.svg",
    category: "Fashion",
    subcategory: "Bags",
    primary_category: "Bags",
    condition: "Like New",
    featured: false,
    views: 56,
    postedDate: "2024-01-09",
  },
]

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

  const filteredProducts = useMemo(() => {
    let results = allProducts

    // Filter by search query
    if (searchQuery) {
      results = results.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.primary_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (filters.subcategory) {
      // Filter by specific subcategory
      results = results.filter((product) => product.primary_category === filters.subcategory)
    } else if (filters.category) {
      // Filter by category only if no subcategory is specified
      results = results.filter((product) => product.category === filters.category)
    }

    // Filter by price range
    const minPrice = Number.parseInt(filters.minPrice) || 0
    const maxPrice = Number.parseInt(filters.maxPrice) || Number.POSITIVE_INFINITY
    results = results.filter((product) => product.price >= minPrice && product.price <= maxPrice)

    // Filter by condition
    if (filters.condition) {
      results = results.filter((product) => product.condition === filters.condition)
    }

    // Filter by location
    if (filters.location) {
      results = results.filter((product) => product.location === filters.location)
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value &&
        !["category", "subcategory", "minPrice", "maxPrice", "condition", "location", "sortBy"].includes(key)
      ) {
        // Apply category-specific filters based on the product's primary category
        console.log(`Filtering by ${key}: ${value} for primary category: ${results[0]?.primary_category}`)
      }
    })

    // Sort results
    switch (filters.sortBy) {
      case "newest":
        results.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
        break
      case "price-low":
        results.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        results.sort((a, b) => b.price - a.price)
        break
      case "distance":
        results.sort((a, b) => a.location.localeCompare(b.location))
        break
      default:
        results.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return b.views - a.views
        })
    }

    return results
  }, [searchQuery, filters])

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
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} found
          {searchQuery && ` for "${searchQuery}"`}
          {filters.subcategory && ` in ${filters.subcategory}`}
          {!filters.subcategory && filters.category && ` in ${filters.category}`}
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

      {/* Results Grid/List */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {filteredProducts.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <Card
              className={`group cursor-pointer hover:shadow-lg hover:bg-green-50 hover:border-green-200 transition-all duration-300 ${
                viewMode === "list" ? "flex-row" : ""
              }`}
            >
              <CardContent className={`p-0 ${viewMode === "list" ? "flex" : ""}`}>
                <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className={`object-cover ${
                      viewMode === "list" ? "w-full h-32" : "w-full h-48"
                    } ${viewMode === "grid" ? "rounded-t-lg" : "rounded-l-lg"}`}
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
                  {product.featured && <Badge className="absolute top-2 left-2 bg-green-800">Featured</Badge>}
                </div>

                <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <h4 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-green-800">
                    {product.title}
                  </h4>
                  <p className="text-2xl font-bold text-primary mb-2">${product.price.toLocaleString()}</p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{product.condition}</span>
                    <span>{product.primary_category}</span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {product.location}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {product.views} views
                    </div>
                    <span>{new Date(product.postedDate).toLocaleDateString()}</span>
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
