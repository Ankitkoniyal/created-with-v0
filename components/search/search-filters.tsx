// components/search/search-filters.tsx - FIXED VERSION
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Filter, X } from "lucide-react"

// Sort options
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
]

interface SearchFiltersProps {
  onFiltersChange?: (filters: any) => void
}

export function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "")
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (minPrice) {
      params.set("minPrice", minPrice)
    } else {
      params.delete("minPrice")
    }

    if (maxPrice) {
      params.set("maxPrice", maxPrice)
    } else {
      params.delete("maxPrice")
    }

    if (sortBy && sortBy !== "newest") {
      params.set("sortBy", sortBy)
    } else {
      params.delete("sortBy")
    }

    const nextQuery = params.toString()
    router.push(nextQuery ? `/search?${nextQuery}` : "/search")
    
    if (onFiltersChange) {
      onFiltersChange({
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sortBy: sortBy !== "newest" ? sortBy : undefined,
      })
    }

    setShowMobileFilters(false)
  }

  const clearFilters = () => {
    setMinPrice("")
    setMaxPrice("")
    setSortBy("newest")
    
    const params = new URLSearchParams(searchParams.toString())
    params.delete("minPrice")
    params.delete("maxPrice")
    params.delete("sortBy")

    const nextQuery = params.toString()
    router.push(nextQuery ? `/search?${nextQuery}` : "/search")
    
    if (onFiltersChange) {
      onFiltersChange({})
    }

    setShowMobileFilters(false)
  }

  const hasActiveFilters = 
    minPrice ||
    maxPrice ||
    (sortBy && sortBy !== "newest")

  // Apply filters when any filter changes (for sidebar auto-apply)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      // Auto-apply filters on desktop (sidebar mode)
      applyFilters()
    }
  }, [minPrice, maxPrice, sortBy])

  return (
    <>
      {/* Mobile Filter Trigger */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(true)}
            className="border-gray-200 w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1"
                  disabled={!hasActiveFilters}
                >
                  Clear
                </Button>
                <Button
                  onClick={applyFilters}
                  className="flex-1 bg-green-900 hover:bg-green-950"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Filters - SIMPLIFIED VERSION */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Budget Range
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                <Input
                  type="number"
                  placeholder="$0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                <Input
                  type="number"
                  placeholder="$10000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Apply Button - Fixed size */}
          <Button
            onClick={applyFilters}
            className="w-full bg-green-900 hover:bg-green-950 h-10"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  )
}
