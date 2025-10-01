// app/search/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchResults } from "@/components/search/search-results"
import SearchFilters from "@/components/search/search-filters"
import { SubcategoryNav } from "@/components/subcategory-nav"
import { Breadcrumb } from "@/components/breadcrumb"

export default function SearchPage() {
  const searchParams = useSearchParams()
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
            />
          </div>
        </div>
      </div>
    </div>
  )
}
