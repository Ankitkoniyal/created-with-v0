// app/search/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Breadcrumb } from "@/components/breadcrumb"
import { SearchResults } from "@/components/search/search-results"
import { SearchFilters } from "@/components/search/search-filters"
import { SubcategoryNav } from "@/components/subcategory-nav"
import { resolveCategoryInput } from "@/lib/category-utils"

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

  // Get location: Priority 1) URL param, 2) localStorage
  const getLocationFromStorage = () => {
    if (typeof window === "undefined") return ""
    const urlLocation = searchParams.get("location") || ""
    if (urlLocation) return urlLocation
    try {
      return localStorage.getItem("user_selected_location") || ""
    } catch {
      return ""
    }
  }

  const urlQuery = searchParams.get("q") || ""
  const urlLocation = getLocationFromStorage()
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
    const resolvedCategory = resolveCategoryInput(filters.category)?.displayName || filters.category
    let title = "Search Products | Your Marketplace"

    if (searchQuery && resolvedCategory) {
      title = `${searchQuery} in ${resolvedCategory} - Search Results | Your Marketplace`
    } else if (searchQuery) {
      title = `${searchQuery} - Search Results | Your Marketplace`
    } else if (resolvedCategory) {
      title = `Browse ${resolvedCategory} | Your Marketplace`
    }

    if (filters.location) {
      title += ` in ${filters.location}`
    }

    if (typeof document !== "undefined") {
      document.title = title
    }
  }, [searchQuery, filters.category, filters.location])

  useEffect(() => {
    // Re-get location in case localStorage changed
    const currentLocation = getLocationFromStorage()
    setSearchQuery(urlQuery)
    setFilters({
      category: urlCategory,
      subcategory: urlSubcategory,
      minPrice: urlMinPrice,
      maxPrice: urlMaxPrice,
      condition: urlCondition,
      location: currentLocation,
      sortBy: urlSortBy,
    })
  }, [urlQuery, urlCategory, urlSubcategory, urlMinPrice, urlMaxPrice, urlCondition, urlSortBy, searchParams])

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

  const resolvedCategory = resolveCategoryInput(filters.category)?.displayName || ""

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
            {resolvedCategory && (
              <SubcategoryNav category={resolvedCategory} selectedSubcategory={filters.subcategory} />
            )}
            <SearchResults searchQuery={searchQuery} filters={filters} />
          </div>
        </div>
      </div>
    </div>
  )
}