"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ImprovedAdCard } from "@/components/improved-ad-card"
import { AdvancedSearchFilters } from "@/components/advanced-search-filters"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getAllAds } from "@/lib/mock-data"
import { Search, MapPin } from "lucide-react"

interface FilterState {
  searchQuery: string
  category: string
  priceMin: string
  priceMax: string
  condition: string
  location: string
  city: string
  state: string
  brand: string
  yearMin: string
  yearMax: string
  negotiable: boolean | null
  sortBy: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: initialQuery,
    category: "all",
    priceMin: "",
    priceMax: "",
    condition: "any",
    location: "",
    city: "any",
    state: "any",
    brand: "any",
    yearMin: "",
    yearMax: "",
    negotiable: null,
    sortBy: "newest",
  })

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [ads, setAds] = useState<any[]>([])

  useEffect(() => {
    const allAds = getAllAds()
    setAds(allAds)
  }, [])

  const filteredAndSortedAds = useMemo(() => {
    let filtered = ads.filter((ad) => ad.status === "active")

    // Search by title and description
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (ad) =>
          ad.title.toLowerCase().includes(query) ||
          ad.description.toLowerCase().includes(query) ||
          ad.brand?.toLowerCase().includes(query) ||
          ad.model?.toLowerCase().includes(query),
      )
    }

    // Filter by category
    if (filters.category !== "all") {
      filtered = filtered.filter((ad) => ad.category_id === filters.category)
    }

    // Filter by condition
    if (filters.condition !== "any") {
      filtered = filtered.filter((ad) => ad.condition === filters.condition)
    }

    // Filter by price range
    if (filters.priceMin) {
      const minPrice = Number.parseFloat(filters.priceMin)
      filtered = filtered.filter((ad) => ad.price && ad.price >= minPrice)
    }
    if (filters.priceMax) {
      const maxPrice = Number.parseFloat(filters.priceMax)
      filtered = filtered.filter((ad) => ad.price && ad.price <= maxPrice)
    }

    // Filter by negotiable
    if (filters.negotiable === true) {
      filtered = filtered.filter((ad) => ad.negotiable)
    }

    // Filter by location
    if (filters.state !== "any") {
      filtered = filtered.filter((ad) => ad.state === filters.state)
    }
    if (filters.city !== "any") {
      filtered = filtered.filter((ad) => ad.city === filters.city)
    }
    if (filters.location) {
      const locationQuery = filters.location.toLowerCase()
      filtered = filtered.filter((ad) => ad.location.toLowerCase().includes(locationQuery))
    }

    // Filter by brand
    if (filters.brand !== "any") {
      filtered = filtered.filter((ad) => ad.brand === filters.brand)
    }

    // Filter by year range
    if (filters.yearMin) {
      const minYear = Number.parseInt(filters.yearMin)
      filtered = filtered.filter((ad) => ad.year && ad.year >= minYear)
    }
    if (filters.yearMax) {
      const maxYear = Number.parseInt(filters.yearMax)
      filtered = filtered.filter((ad) => ad.year && ad.year <= maxYear)
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price_low":
          return (a.price || 0) - (b.price || 0)
        case "price_high":
          return (b.price || 0) - (a.price || 0)
        case "title":
          return a.title.localeCompare(b.title)
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }, [ads, filters])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by the useMemo above
  }

  const clearAllFilters = () => {
    setFilters({
      searchQuery: "",
      category: "all",
      priceMin: "",
      priceMax: "",
      condition: "any",
      location: "",
      city: "any",
      state: "any",
      brand: "any",
      yearMin: "",
      yearMax: "",
      negotiable: null,
      sortBy: "newest",
    })
  }

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "searchQuery" || key === "sortBy") return false
      if (key === "category") return value !== "all"
      if (key === "negotiable") return value !== null
      return value !== "" && value !== "any"
    }).length
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">
            {filters.searchQuery ? `Search results for "${filters.searchQuery}"` : "Browse All Ads"}
          </h1>

          {/* Quick Search Bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for products, brands, models..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Button type="button" variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                Advanced Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>
            </form>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <AdvancedSearchFilters filters={filters} onFiltersChange={setFilters} onClearFilters={clearAllFilters} />
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {filteredAndSortedAds.length} {filteredAndSortedAds.length === 1 ? "result" : "results"} found
              {activeFiltersCount > 0 &&
                ` with ${activeFiltersCount} filter${activeFiltersCount === 1 ? "" : "s"} applied`}
            </p>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                {filters.city !== "any" && <span>{filters.city}</span>}
                {filters.state !== "any" && filters.city === "any" && <span>{filters.state}</span>}
                {filters.priceMin && <span>₹{filters.priceMin}+</span>}
                {filters.priceMax && <span>up to ₹{filters.priceMax}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {filteredAndSortedAds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedAds.map((ad) => (
              <ImprovedAdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <p className="text-gray-500 text-lg mb-2">No ads found matching your criteria.</p>
              <p className="text-gray-400 mb-4">Try adjusting your search filters or search terms.</p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
