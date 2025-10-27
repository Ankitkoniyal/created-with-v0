// app/search/page.tsx - COMPLETE FIXED VERSION
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ProductGrid } from "@/components/product-grid"
import { SearchFilters } from "@/components/search/search-filters"
import { SubcategoryNav } from "@/components/subcategory-nav"

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
    <div className="min-h-screen bg-gray-50">
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
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <SearchFilters onFiltersChange={handleFiltersChange} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Subcategory Navigation */}
            {filters.category && (
              <SubcategoryNav 
                category={filters.category} 
                selectedSubcategory={filters.subcategory}
              />
            )}

            {/* Product Grid */}
            <ProductGrid 
              searchQuery={filters.searchQuery}
              filters={filters}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
