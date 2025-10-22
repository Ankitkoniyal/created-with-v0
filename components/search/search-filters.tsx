// components/search/search-filters.tsx - COMPLETE UPDATED VERSION
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { 
  X, Filter, DollarSign, ArrowUpDown, Tag
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useMemo, useEffect } from "react"
import { CATEGORY_OPTIONS, getSubcategoriesByCategory } from "@/lib/categories"

interface SearchFiltersProps {
  searchQuery: string
  onFiltersChange?: (filters: any) => void
}

// Condition options that match ad posting
const CONDITION_OPTIONS = [
  { value: "all", label: "All items" },
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "used", label: "Used" },
  { value: "for_parts", label: "For Parts" }
]

const SearchFilters = ({ searchQuery, onFiltersChange }: SearchFiltersProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current filter values from URL
  const sortBy = searchParams.get("sortBy") || "newest"
  const condition = searchParams.get("condition") || "all"
  const category = searchParams.get("category") || "all"
  const subcategory = searchParams.get("subcategory") || "all"
  const minPrice = searchParams.get("minPrice") || ""
  const maxPrice = searchParams.get("maxPrice") || ""

  const [priceRange, setPriceRange] = useState(() => [
    Number.parseInt(minPrice) || 0,
    Number.parseInt(maxPrice) || 10000,
  ])

  // Get subcategories based on selected category
  const availableSubcategories = useMemo(() => {
    if (category && category !== "all") {
      return getSubcategoriesByCategory(category)
    }
    return []
  }, [category])

  // Update filters function
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

    // Notify parent component
    if (onFiltersChange) {
      onFiltersChange({
        minPrice: params.get("minPrice") || "",
        maxPrice: params.get("maxPrice") || "",
        condition: params.get("condition") || "all",
        sortBy: params.get("sortBy") || "newest",
        category: params.get("category") || "all",
        subcategory: params.get("subcategory") || "all",
      })
    }
  }, [router, searchParams, onFiltersChange])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    
    setPriceRange([0, 10000])
    
    if (onFiltersChange) {
      onFiltersChange({
        minPrice: "",
        maxPrice: "",
        condition: "all",
        sortBy: "newest",
        category: "all",
        subcategory: "all",
      })
    }
    
    router.push(`/search?${params.toString()}`)
  }, [router, searchQuery, onFiltersChange])

  const hasActiveFilters = useMemo(() =>
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    sortBy !== "newest" ||
    (condition && condition !== "all") ||
    (category && category !== "all") ||
    (subcategory && subcategory !== "all")
  , [priceRange, sortBy, condition, category, subcategory])

  // Sync price range with URL parameters
  useEffect(() => {
    const newMin = Number.parseInt(minPrice) || 0
    const newMax = Number.parseInt(maxPrice) || 10000
    setPriceRange([newMin, newMax])
  }, [minPrice, maxPrice])

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
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
              className="text-white hover:bg-white/20 hover:text-white border border-white/30"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Category Filter */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-green-600" />
            Category
          </Label>
          <Select 
            value={category} 
            onValueChange={(value) => {
              // When category changes, clear subcategory
              updateFilters({ 
                category: value,
                subcategory: null 
              })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategory Filter - Only show if category is selected */}
        {availableSubcategories.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-800">
                Subcategory
              </Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="subcategory"
                    value="all"
                    checked={subcategory === "all" || !subcategory}
                    onChange={(e) => updateFilters({ subcategory: e.target.value })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">All {category}</span>
                </label>
                {availableSubcategories.map((subcat) => (
                  <label key={subcat} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="subcategory"
                      value={subcat}
                      checked={subcategory === subcat}
                      onChange={(e) => updateFilters({ subcategory: e.target.value })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{subcat}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Price Range */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-gray-800 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Price Range
          </Label>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>$0</span>
              <span>$10K</span>
            </div>
            
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
              step={100}
              className="w-full"
            />
            
            <div className="text-center text-sm text-gray-500">
              All items
            </div>
          </div>
        </div>

        <Separator />

        {/* Condition */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">Condition</Label>
          <div className="space-y-2">
            {CONDITION_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="condition"
                  value={option.value}
                  checked={condition === option.value}
                  onChange={(e) => updateFilters({ condition: e.target.value })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Sort By */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800 flex items-center">
            <ArrowUpDown className="h-5 w-5 mr-2 text-green-600" />
            Sort By
          </Label>
          <Select 
            value={sortBy} 
            onValueChange={(value) => updateFilters({ sortBy: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="relevance">Relevance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default SearchFilters
