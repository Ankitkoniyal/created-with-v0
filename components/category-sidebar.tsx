"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { X, Filter } from "lucide-react"
import {
  kmDrivenOptions,
  numberOfOwnersOptions,
  manufacturingYearOptions,
  transmissionOptions,
  fuelTypeOptions,
  brandsByCategory,
} from "@/lib/mock-data"

interface CategorySidebarProps {
  category: string
  filters: any
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
}

export function CategorySidebar({ category, filters, onFiltersChange, onClearFilters }: CategorySidebarProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const selectedCategoryBrands = brandsByCategory[category] || []

  const renderElectronicsFilters = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Brand</Label>
        <Select value={filters.brand || "any"} onValueChange={(value) => updateFilter("brand", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Brand</SelectItem>
            {selectedCategoryBrands.map((brand) => (
              <SelectItem key={brand} value={brand.toLowerCase()}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Storage</Label>
        <Select value={filters.storage || "any"} onValueChange={(value) => updateFilter("storage", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Storage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Storage</SelectItem>
            <SelectItem value="64gb">64GB</SelectItem>
            <SelectItem value="128gb">128GB</SelectItem>
            <SelectItem value="256gb">256GB</SelectItem>
            <SelectItem value="512gb">512GB</SelectItem>
            <SelectItem value="1tb">1TB+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">RAM</Label>
        <Select value={filters.ram || "any"} onValueChange={(value) => updateFilter("ram", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any RAM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any RAM</SelectItem>
            <SelectItem value="4gb">4GB</SelectItem>
            <SelectItem value="6gb">6GB</SelectItem>
            <SelectItem value="8gb">8GB</SelectItem>
            <SelectItem value="12gb">12GB+</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderCarFilters = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Brand</Label>
        <Select value={filters.brand || "any"} onValueChange={(value) => updateFilter("brand", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Brand</SelectItem>
            {selectedCategoryBrands.map((brand) => (
              <SelectItem key={brand} value={brand.toLowerCase()}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">KM Driven</Label>
        <Select value={filters.kmDriven || "any"} onValueChange={(value) => updateFilter("kmDriven", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any KM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any KM</SelectItem>
            {kmDrivenOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Number of Owners</Label>
        <Select
          value={filters.numberOfOwners || "any"}
          onValueChange={(value) => updateFilter("numberOfOwners", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Owner</SelectItem>
            {numberOfOwnersOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Manufacturing Year</Label>
        <Select
          value={filters.manufacturingYear || "any"}
          onValueChange={(value) => updateFilter("manufacturingYear", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Year</SelectItem>
            {manufacturingYearOptions().map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Transmission Type</Label>
        <Select
          value={filters.transmissionType || "any"}
          onValueChange={(value) => updateFilter("transmissionType", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Transmission</SelectItem>
            {transmissionOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Fuel Type</Label>
        <Select value={filters.fuelType || "any"} onValueChange={(value) => updateFilter("fuelType", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Fuel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Fuel</SelectItem>
            {fuelTypeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderBikeFilters = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Brand</Label>
        <Select value={filters.brand || "any"} onValueChange={(value) => updateFilter("brand", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Brand</SelectItem>
            {selectedCategoryBrands.map((brand) => (
              <SelectItem key={brand} value={brand.toLowerCase()}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">KM Driven</Label>
        <Select value={filters.kmDriven || "any"} onValueChange={(value) => updateFilter("kmDriven", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any KM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any KM</SelectItem>
            {kmDrivenOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Number of Owners</Label>
        <Select
          value={filters.numberOfOwners || "any"}
          onValueChange={(value) => updateFilter("numberOfOwners", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Owner</SelectItem>
            {numberOfOwnersOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Manufacturing Year</Label>
        <Select
          value={filters.manufacturingYear || "any"}
          onValueChange={(value) => updateFilter("manufacturingYear", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Year</SelectItem>
            {manufacturingYearOptions().map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Transmission Type</Label>
        <Select
          value={filters.transmissionType || "any"}
          onValueChange={(value) => updateFilter("transmissionType", value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Transmission</SelectItem>
            {transmissionOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Fuel Type</Label>
        <Select value={filters.fuelType || "any"} onValueChange={(value) => updateFilter("fuelType", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Fuel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Fuel</SelectItem>
            <SelectItem value="petrol">Petrol</SelectItem>
            <SelectItem value="electric">Electric</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderRealEstateFilters = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Property Type</Label>
        <Select value={filters.propertyType || "any"} onValueChange={(value) => updateFilter("propertyType", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any Property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Property</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="plot">Plot</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="pg">PG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">BHK</Label>
        <Select value={filters.bhk || "any"} onValueChange={(value) => updateFilter("bhk", value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Any BHK" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any BHK</SelectItem>
            <SelectItem value="1">1 BHK</SelectItem>
            <SelectItem value="2">2 BHK</SelectItem>
            <SelectItem value="3">3 BHK</SelectItem>
            <SelectItem value="4+">4+ BHK</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderDefaultFilters = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Condition</Label>
        <Select value={filters.condition || "any"} onValueChange={(value) => updateFilter("condition", value)}>
          <SelectTrigger className="mt-1">
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

      {selectedCategoryBrands.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Brand</Label>
          <Select value={filters.brand || "any"} onValueChange={(value) => updateFilter("brand", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Brand</SelectItem>
              {selectedCategoryBrands.map((brand) => (
                <SelectItem key={brand} value={brand.toLowerCase()}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )

  const getCategoryFilters = () => {
    switch (category) {
      case "1": // Electronics
        return renderElectronicsFilters()
      case "2": // Car
        return renderCarFilters()
      case "10": // Bikes
        return renderBikeFilters()
      case "11": // Real Estate
        return renderRealEstateFilters()
      default:
        return renderDefaultFilters()
    }
  }

  const hasActiveFilters = Object.values(filters).some((value) => value && value !== "" && value !== "any")

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-red-600 hover:text-red-700">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium">Price Range (₹)</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Input
              placeholder="Min"
              type="number"
              value={filters.priceMin || ""}
              onChange={(e) => updateFilter("priceMin", e.target.value)}
            />
            <Input
              placeholder="Max"
              type="number"
              value={filters.priceMax || ""}
              onChange={(e) => updateFilter("priceMax", e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Category-specific filters */}
        {getCategoryFilters()}

        <Separator />

        {/* Location */}
        <div>
          <Label className="text-sm font-medium">Location</Label>
          <Input
            placeholder="Enter city or area"
            value={filters.location || ""}
            onChange={(e) => updateFilter("location", e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Negotiable */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="negotiable"
            checked={filters.negotiable || false}
            onCheckedChange={(checked) => updateFilter("negotiable", checked)}
          />
          <Label htmlFor="negotiable" className="text-sm">
            Negotiable price only
          </Label>
        </div>
      </CardContent>
    </Card>
  )
}
