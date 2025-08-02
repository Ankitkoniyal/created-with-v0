// components/advanced-search-filters.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, MapPin, Filter } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Category {
  id: string
  name: string
}

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

interface AdvancedSearchFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClearFilters: () => void
}

export function AdvancedSearchFilters({ filters, onFiltersChange, onClearFilters }: AdvancedSearchFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const { toast } = useToast()

  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isPriceOpen, setIsPriceOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Fetch categories from Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("id, name")
      if (error) {
        console.error("Error fetching categories:", error.message)
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again later.",
          variant: "destructive"
        })
      } else {
        setCategories(data || [])
      }
      setLoadingCategories(false)
    }
    fetchCategories()
  }, [toast])

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "searchQuery" || key === "sortBy") return false
    if (key === "category") return value !== "all"
    if (key === "negotiable") return value !== null
    return value !== "" && value !== "any"
  })

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Advanced Filters
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {loadingCategories ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select value={filters.condition} onValueChange={(value) => updateFilter("condition", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Any Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Condition</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like_new">Like New</SelectItem>
                <SelectItem value="second_hand">Second Hand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sortBy">Sort By</Label>
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Most Recent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location Filters */}
        <Collapsible open={isLocationOpen} onOpenChange={setIsLocationOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Location Filters</span>
              </div>
              {isLocationOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <Label htmlFor="location">Area/Locality</Label>
            <Input
              id="location"
              placeholder="e.g., Andheri, Koramangala"
              value={filters.location}
              onChange={(e) => updateFilter("location", e.target.value)}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Price Filters */}
        <Collapsible open={isPriceOpen} onOpenChange={setIsPriceOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <span className="font-medium">Price Range</span>
              </div>
              {isPriceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceMin">Min Price (₹)</Label>
                <Input
                  id="priceMin"
                  type="number"
                  placeholder="0"
                  value={filters.priceMin}
                  onChange={(e) => updateFilter("priceMin", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="priceMax">Max Price (₹)</Label>
                <Input
                  id="priceMax"
                  type="number"
                  placeholder="No limit"
                  value={filters.priceMax}
                  onChange={(e) => updateFilter("priceMax", e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="negotiable"
                checked={filters.negotiable === true}
                onCheckedChange={(checked) => updateFilter("negotiable", checked ? true : null)}
              />
              <Label htmlFor="negotiable">Negotiable price only</Label>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Additional Details */}
        <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <span className="font-medium">Additional Details</span>
              </div>
              {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Apple, Samsung"
                  value={filters.brand}
                  onChange={(e) => updateFilter("brand", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="yearMin">Year From</Label>
                <Input
                  id="yearMin"
                  type="number"
                  placeholder="e.g., 2020"
                  value={filters.yearMin}
                  onChange={(e) => updateFilter("yearMin", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="yearMax">Year To</Label>
                <Input
                  id="yearMax"
                  type="number"
                  placeholder="e.g., 2024"
                  value={filters.yearMax}
                  onChange={(e) => updateFilter("yearMax", e.target.value)}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}