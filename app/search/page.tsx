// app/search/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Breadcrumb } from "@/components/breadcrumb"
import { SearchResults } from "@/components/search/search-results"
import { SearchFilters } from "@/components/search/search-filters"
import { SubcategoryNav } from "@/components/subcategory-nav"

interface FiltersState {
  category: string
  subcategory: string
  minPrice: string
  maxPrice: string
  condition: string
  location: string
  sortBy: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()

  const urlQuery = searchParams.get("q") || ""
  const urlLocation = searchParams.get("location") || ""
  const urlCategory = searchParams.get("category") || ""
  const urlSubcategory = searchParams.get("subcategory") || ""
  const urlMinPrice = searchParams.get("minPrice") || ""
  const urlMaxPrice = searchParams.get("maxPrice") || ""
  const urlCondition = searchParams.get("condition") || "all"
  const urlSortBy = searchParams.get("sortBy") || "newest"

  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [filters, setFilters] = useState<FiltersState>({
    category: urlCategory,
    subcategory: urlSubcategory,
    minPrice: urlMinPrice,
    maxPrice: urlMaxPrice,
    condition: urlCondition,
    location: urlLocation,
    sortBy: urlSortBy,
  })

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

    if (typeof document !== "undefined") {
      document.title = title
    }
  }, [searchQuery, filters.category, filters.location])

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

  const handleFiltersChange = (newFilters: Partial<FiltersState>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    {
      label: `Search${searchQuery ? ` for "${searchQuery}"` : ""}`,
      href: `/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`,
    },
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
            <SearchFilters onFiltersChange={handleFiltersChange} />
          </div>
          <div className="lg:col-span-3">
            {filters.category && (
              <SubcategoryNav category={filters.category} selectedSubcategory={filters.subcategory} />
            )}
            <SearchResults searchQuery={searchQuery} filters={filters} />
          </div>
        </div>
      </div>
    </div>
  )
}