// app/search/page.tsx - WITH CORRECT IMPORT
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import SearchFilters from "@/components/search/search-filters" // DEFAULT IMPORT
import { ProductGrid } from "@/components/product-grid"
import { SubcategoryNav } from "@/components/subcategory-nav"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SlidersHorizontal } from "lucide-react"

function SearchPageContent() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const subcategory = searchParams.get("subcategory") || ""
  
  const [filters, setFilters] = useState({})

  useEffect(() => {
    const currentFilters = {
      searchQuery,
      category,
      subcategory,
      condition: searchParams.get("condition") || "all",
      sortBy: searchParams.get("sortBy") || "newest",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
    }
    setFilters(currentFilters)
  }, [searchParams, searchQuery, category, subcategory])

  const handleFiltersChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Search results for "${searchQuery}"` : "Browse All Listings"}
          </h1>
          {(category || searchQuery) && (
            <p className="text-gray-600">
              {category && `Category: ${category}`}
              {subcategory && ` > ${subcategory}`}
              {searchQuery && category && ` • Searching: "${searchQuery}"`}
            </p>
          )}
        </div>

        {/* Mobile Filters Button with Sheet */}
        <div className="lg:hidden mb-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SearchFilters 
                searchQuery={searchQuery}
                onFiltersChange={handleFiltersChange}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filters */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <SearchFilters 
              searchQuery={searchQuery}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Subcategory Navigation */}
            {category && (
              <SubcategoryNav 
                category={category} 
                selectedSubcategory={subcategory} 
              />
            )}

            {/* Results */}
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            }>
              <ProductGrid 
                searchQuery={searchQuery}
                filters={filters}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading search results...</div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
