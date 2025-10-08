// components/search/search-filters.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { X, Filter, DollarSign, ArrowUpDown, MapPin } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useMemo, useEffect, useRef } from "react"
import { getAllCategoryNames, getFiltersByCategory } from "@/lib/categories"

interface SearchFiltersProps {
  searchQuery: string
  onFiltersChange?: (filters: any) => void
}

// Pre-defined Canadian locations (static data - no API calls)
const CANADIAN_LOCATIONS = [
  "Vancouver, British Columbia",
  "Victoria, British Columbia", 
  "Surrey, British Columbia",
  "Burnaby, British Columbia",
  "Richmond, British Columbia",
  "Calgary, Alberta",
  "Edmonton, Alberta",
  "Toronto, Ontario",
  "Ottawa, Ontario",
  "Mississauga, Ontario",
  "Montreal, Quebec",
  "Quebec City, Quebec",
  "Winnipeg, Manitoba",
  "Halifax, Nova Scotia"
]

const SearchFilters = ({ searchQuery, onFiltersChange }: SearchFiltersProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current filter values from URL
  const selectedCategory = searchParams.get("category") || ""
  const selectedSubcategory = searchParams.get("subcategory") || ""
  const location = searchParams.get("location") || ""
  const sortBy = searchParams.get("sortBy") || "newest"
  const condition = searchParams.get("condition") || "all"
  const minPrice = searchParams.get("minPrice") || ""
  const maxPrice = searchParams.get("maxPrice") || ""

  const [priceRange, setPriceRange] = useState(() => [
    Number.parseInt(minPrice) || 0,
    Number.parseInt(maxPrice) || 10000,
  ])

  const [locationInput, setLocationInput] = useState(location)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [filteredLocations, setFilteredLocations] = useState<string[]>([])
  const locationInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Memoize location filtering for performance
  const filterLocations = useCallback((query: string): string[] => {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    return CANADIAN_LOCATIONS.filter(location => 
      location.toLowerCase().includes(lowerQuery)
    ).slice(0, 8)
  }, [])

  // Debounced location search
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocationInput(value)
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    if (value.trim() === "") {
      setFilteredLocations([])
      setShowLocationSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      const filtered = filterLocations(value)
      setFilteredLocations(filtered)
      setShowLocationSuggestions(filtered.length > 0)
    }, 300)
  }

  // Handle location selection
  const handleLocationSelect = (selectedLocation: string) => {
    setLocationInput(selectedLocation)
    setShowLocationSuggestions(false)
    updateFilters({ location: selectedLocation })
    if (locationInputRef.current) {
      locationInputRef.current.blur()
    }
  }

  // Update filters function - FIXED: Proper null handling
  const updateFilters = useCallback((updates: { [key: string]: string | null }) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    // Update URL immediately
    router.push(`/search?${params.toString()}`, { scroll: false })

    // Notify parent component with proper values
    if (onFiltersChange) {
      onFiltersChange({
        category: params.get("category") || "",
        subcategory: params.get("subcategory") || "",
        minPrice: params.get("minPrice") || "",
        maxPrice: params.get("maxPrice") || "",
        condition: params.get("condition") || "all",
        location: params.get("location") || "",
        sortBy: params.get("sortBy") || "newest",
      })
    }
  }, [router, searchParams, onFiltersChange])

  // Update location filter when input changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationInput !== location) {
        updateFilters({ location: locationInput || null })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [locationInput, location, updateFilters])

  // Update price range when URL changes
  useEffect(() => {
    setPriceRange([
      Number.parseInt(minPrice) || 0,
      Number.parseInt(maxPrice) || 10000,
    ])
  }, [minPrice, maxPrice])

  // Sync location input with URL parameter
  useEffect(() => {
    setLocationInput(location)
  }, [location])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const categoryOptions = selectedCategory ? getFiltersByCategory(selectedCategory) : {}

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    
    setLocationInput("")
    setPriceRange([0, 10000])
    
    if (onFiltersChange) {
      onFiltersChange({
        category: "",
        subcategory: "",
        minPrice: "",
        maxPrice: "",
        condition: "all",
        location: "",
        sortBy: "newest",
      })
    }
    
    router.push(`/search?${params.toString()}`)
  }, [router, searchQuery, onFiltersChange])

  const hasActiveFilters =
    selectedCategory ||
    selectedSubcategory ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    location ||
    sortBy !== "newest" ||
    (condition && condition !== "all")

  return (
    <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl shadow-lg">
      <div className="bg-gradient-to-r from-green-900 to-green-800 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Filters</h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-white hover:bg-white/20 hover:text-green-900 border border-white/30"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Location Filter */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-green-600" />
            Location
          </Label>
          <div className="relative">
            <Input
              ref={locationInputRef}
              placeholder="Enter city or province"
              value={locationInput}
              onChange={handleLocationInputChange}
              onFocus={() => {
                if (locationInput) {
                  const filtered = filterLocations(locationInput)
                  setFilteredLocations(filtered)
                  setShowLocationSuggestions(filtered.length > 0)
                }
              }}
              onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
              className="border-2 border-gray-200 hover:border-green-400 focus:border-green-500"
            />
            
            {showLocationSuggestions && filteredLocations.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-64 overflow-y-auto">
                {filteredLocations.map((location, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm border-b border-gray-100 last:border-b-0 flex items-center"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleLocationSelect(location)
                    }}
                  >
                    <MapPin className="h-3 w-3 mr-2 text-green-600 flex-shrink-0" />
                    <span className="truncate">{location}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">Start typing to search by location</p>
        </div>

        <Separator className="bg-green-200" />

        {/* Category Selection */}
        {!selectedCategory && (
          <>
            <div className="space-y-4">
              <Label className="text-base font-semibold text-gray-800">Select Category</Label>
              <div className="grid grid-cols-2 gap-3">
                {getAllCategoryNames().map((category) => (
                  <button
                    key={category}
                    onClick={() => updateFilters({ category: category, subcategory: null })}
                    className="p-3 text-left border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-sm font-medium"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <Separator className="bg-green-200" />
          </>
        )}

        {/* Category-specific Filters */}
        {selectedCategory && Object.keys(categoryOptions).length > 0 && (
          <>
            <div className="space-y-5">
              <Label className="text-base font-semibold text-gray-800">
                {selectedCategory} Filters
              </Label>
              <div className="flex flex-wrap gap-4">
                {Object.entries(categoryOptions).map(([filterType, options]) => (
                  <div key={filterType} className="flex-1 min-w-[200px] space-y-2">
                    <Label className="text-sm font-medium text-gray-700">{filterType}</Label>
                    <Select
                      value={searchParams.get(filterType.toLowerCase().replace(/\s+/g, "_")) || "all"}
                      onValueChange={(value) => {
                        const filterKey = filterType.toLowerCase().replace(/\s+/g, "_")
                        updateFilters({ [filterKey]: value === "all" ? null : value })
                      }}
                    >
                      <SelectTrigger className="w-full bg-white border-2 border-gray-200 hover:border-green-400 focus:border-green-500 transition-colors">
                        <SelectValue placeholder={`Any ${filterType}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any {filterType}</SelectItem>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            <Separator className="bg-green-200" />
          </>
        )}

        {/* Selected Category Display */}
        {(selectedCategory || selectedSubcategory) && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-600">Filtering by: </span>
                <span className="font-medium text-green-800">
                  {selectedSubcategory && selectedSubcategory !== "all" ? selectedSubcategory : selectedCategory}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ category: null, subcategory: null })}
                className="text-green-700 hover:bg-green-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Price Range */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-gray-800 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Price Range
          </Label>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              onValueCommit={(value) => {
                updateFilters({
                  minPrice: value[0] > 0 ? value[0].toString() : null,
                  maxPrice: value[1] < 10000 ? value[1].toString() : null,
                })
              }}
              max={10000}
              min={0}
              step={50}
              className="w-full mb-4"
            />
            <div className="flex justify-between text-sm font-medium text-gray-600 mb-3">
              <span>${priceRange[0].toLocaleString()}</span>
              <span>${priceRange[1].toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Min Price"
                type="number"
                value={priceRange[0]}
                onChange={(e) => {
                  const newMin = Number.parseInt(e.target.value) || 0
                  setPriceRange([newMin, priceRange[1]])
                }}
                onBlur={() => {
                  updateFilters({ minPrice: priceRange[0] > 0 ? priceRange[0].toString() : null })
                }}
                className="border-2 border-gray-200 hover:border-green-400 focus:border-green-500"
              />
              <Input
                placeholder="Max Price"
                type="number"
                value={priceRange[1]}
                onChange={(e) => {
                  const newMax = Number.parseInt(e.target.value) || 10000
                  setPriceRange([priceRange[0], newMax])
                }}
                onBlur={() => {
                  updateFilters({ maxPrice: priceRange[1] < 10000 ? priceRange[1].toString() : null })
                }}
                className="border-2 border-gray-200 hover:border-green-400 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-green-200" />

        {/* Sort By - FIXED: No empty string values */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800 flex items-center">
            <ArrowUpDown className="h-5 w-5 mr-2 text-green-600" />
            Sort By
          </Label>
          <Select 
            value={sortBy} 
            onValueChange={(value) => updateFilters({ sortBy: value })}
          >
            <SelectTrigger className="w-full bg-white border-2 border-gray-200 hover:border-green-400 focus:border-green-500 transition-colors">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-green-200" />

        {/* Condition - FIXED: No empty string values */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">Condition</Label>
          <Select 
            value={condition} 
            onValueChange={(value) => updateFilters({ condition: value === "all" ? null : value })}
          >
            <SelectTrigger className="w-full bg-white border-2 border-gray-200 hover:border-green-400 focus:border-green-500 transition-colors">
              <SelectValue placeholder="Any condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any condition</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="like new">Like New</SelectItem>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="salvage">Salvage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default SearchFilters
