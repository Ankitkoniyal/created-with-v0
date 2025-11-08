<<<<<<< HEAD
// app/search/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
=======
// app/search/page.tsx - UPDATED WITHOUT GRID/LIST TOGGLE
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
>>>>>>> dc13c296036f9d408027fc6b97e1464d41b5c2ae
import { SearchResults } from "@/components/search/search-results"
import { SearchFilters } from "@/components/search/search-filters"

interface SearchFilters {
  searchQuery?: string
  category?: string
  subcategory?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
  sortBy?: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()
<<<<<<< HEAD
  const router = useRouter()

  // Get all parameters from URL
  const urlQuery = searchParams.get("q") || ""
  const urlLocation = searchParams.get("location") || ""
  const urlCategory = searchParams.get("category") || ""
  const urlSubcategory = searchParams.get("subcategory") || ""
  const urlMinPrice = searchParams.get("minPrice") || ""
  const urlMaxPrice = searchParams.get("maxPrice") || ""
  const urlCondition = searchParams.get("condition") || "all"
  const urlSortBy = searchParams.get("sortBy") || "newest"

  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [filters, setFilters] = useState({
    category: urlCategory,
    subcategory: urlSubcategory,
    minPrice: urlMinPrice,
    maxPrice: urlMaxPrice,
    condition: urlCondition,
    location: urlLocation,
    sortBy: urlSortBy,
  })

  // 🔥 DYNAMIC TITLE UPDATE FOR SEO
  useEffect(() => {
    let title = "Search Products | Your Marketplace"
    
    if (searchQuery && filters.category) {
      title = `${searchQuery} in ${filters.category} - Search Results | Your Marketplace`
    } else if (searchQuery) {
      title = `${searchQuery} - Search Results | Your Marketplace`
    } else if (filters.category) {
      title = `Browse ${filters.category} | Your Marketplace`
    }

    if (filters.location) {
      title += ` in ${filters.location}`
    }

    document.title = title
  }, [searchQuery, filters.category, filters.location])

  // Update state when URL parameters change
  useEffect(() => {
    setSearchQuery(urlQuery)
    setFilters({
      category: urlCategory,
      subcategory: urlSubcategory,
      minPrice: urlMinPrice,
      maxPrice: urlMaxPrice,
      condition: urlCondition,
      location: urlLocation,
      sortBy: urlSortBy,
    })
  }, [urlQuery, urlLocation, urlCategory, urlSubcategory, urlMinPrice, urlMaxPrice, urlCondition, urlSortBy])

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
    
    // Update URL without page reload
    const params = new URLSearchParams()
    
    if (searchQuery) params.set("q", searchQuery)
    if (newFilters.category) params.set("category", newFilters.category)
    if (newFilters.subcategory) params.set("subcategory", newFilters.subcategory)
    if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice)
    if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice)
    if (newFilters.condition && newFilters.condition !== "all") params.set("condition", newFilters.condition)
    if (newFilters.location) params.set("location", newFilters.location)
    if (newFilters.sortBy && newFilters.sortBy !== "newest") params.set("sortBy", newFilters.sortBy)
    
    router.push(`/search?${params.toString()}`, { scroll: false })
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: `Search${searchQuery ? ` for "${searchQuery}"` : ""}`, href: `/search${searchQuery ? `?q=${searchQuery}` : ""}` },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {searchQuery ? `Search results for "${searchQuery}"` : "Browse Products"}
            {filters.location && ` in ${filters.location}`}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <SearchFilters 
              searchQuery={searchQuery}
              onFiltersChange={handleFiltersChange}
            />
          </div>
          <div className="lg:col-span-3">
            {filters.category && (
              <SubcategoryNav category={filters.category} selectedSubcategory={filters.subcategory} />
            )}
            <SearchResults 
              searchQuery={searchQuery} 
              filters={filters}
=======
  const [filters, setFilters] = useState<SearchFilters>({})
  const [isLoading, setIsLoading] = useState(true)

  // Get initial values from URL parameters
  const searchQuery = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const subcategory = searchParams.get("subcategory") || ""
  const condition = searchParams.get("condition") || ""
  const minPrice = searchParams.get("minPrice") || ""
  const maxPrice = searchParams.get("maxPrice") || ""
  const sortBy = searchParams.get("sortBy") || ""

  useEffect(() => {
    // Set initial filters from URL
    const initialFilters: SearchFilters = {}
    
    if (searchQuery) initialFilters.searchQuery = searchQuery
    if (category) initialFilters.category = category
    if (subcategory) initialFilters.subcategory = subcategory
    if (condition) initialFilters.condition = condition
    if (minPrice) initialFilters.minPrice = minPrice
    if (maxPrice) initialFilters.maxPrice = maxPrice
    if (sortBy) initialFilters.sortBy = sortBy

    setFilters(initialFilters)
    setIsLoading(false)
  }, [searchQuery, category, subcategory, condition, minPrice, maxPrice, sortBy])

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-3">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {filters.searchQuery 
              ? `Search Results for "${filters.searchQuery}"`
              : filters.category 
                ? `Browse ${filters.category}`
                : "Browse All Ads"
            }
          </h1>
          <p className="text-gray-600">
            {filters.searchQuery 
              ? "Find what you're looking for"
              : "Discover amazing deals near you"
            }
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar - SIMPLIFIED */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <SearchFilters onFiltersChange={handleFiltersChange} />
          </div>

          {/* Main Content - FULL WIDTH WITHOUT IMAGE */}
          <div className="flex-1">
            {/* Search Results with HOME SCREEN DESIGN */}
            <SearchResults 
              searchQuery={filters.searchQuery || ""}
              filters={filters}
              viewMode="grid" // Default view mode, but not used anymore
>>>>>>> dc13c296036f9d408027fc6b97e1464d41b5c2ae
            />
          </div>
        </div>
      </div>
    </div>
  )
}