"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, MapPin, Filter } from "lucide-react"
import { mockCategories, indianStates, majorCities, brandsByCategory } from "@/lib/mock-data"

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
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isPriceOpen, setIsPriceOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const selectedCategoryBrands =
    filters.category && filters.category !== "all" ? brandsByCategory[filters.category] || [] : []

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
                {mockCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
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
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
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
                <SelectItem value="title">Title A-Z</SelectItem>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={filters.state} onValueChange={(value) => updateFilter("state", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All States</SelectItem>
                    {indianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Select value={filters.city} onValueChange={(value) => updateFilter("city", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">All Cities</SelectItem>
                    {majorCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Area/Locality</Label>
                <Input
                  id="location"
                  placeholder="e.g., Andheri, Koramangala"
                  value={filters.location}
                  onChange={(e) => updateFilter("location", e.target.value)}
                />
              </div>
            </div>
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
              {selectedCategoryBrands.length > 0 && (
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Select value={filters.brand} onValueChange={(value) => updateFilter("brand", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Brand</SelectItem>
                      {selectedCategoryBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
