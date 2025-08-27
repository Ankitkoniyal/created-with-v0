"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { X, Filter, DollarSign, ArrowUpDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useMemo } from "react"

const categories = [
  "Vehicles",
  "Electronics",
  "Mobile",
  "Real Estate",
  "Fashion",
  "Pets",
  "Furniture",
  "Jobs",
  "Gaming",
  "Books",
  "Services",
  "Other",
]

const subcategories: Record<string, string[]> = {
  Electronics: [
    "TV",
    "Fridge",
    "Oven",
    "AC",
    "Cooler",
    "Toaster",
    "Fan",
    "Washing Machine",
    "Microwave",
    "Computer",
    "Laptop",
    "Camera",
    "Audio System",
  ],
  Vehicles: [
    "Cars",
    "Motorcycles",
    "Trucks",
    "Buses",
    "Bicycles",
    "Scooters",
    "Boats",
    "RVs",
    "ATVs",
    "Parts & Accessories",
  ],
  Mobile: [
    "Smartphones",
    "Tablets",
    "Accessories",
    "Cases & Covers",
    "Chargers",
    "Headphones",
    "Smart Watches",
    "Power Banks",
  ],
  "Real Estate": [
    "Houses",
    "Apartments",
    "Commercial",
    "Land",
    "Rental",
    "Vacation Rentals",
    "Office Space",
    "Warehouse",
  ],
  Fashion: [
    "Men's Clothing",
    "Women's Clothing",
    "Kids Clothing",
    "Shoes",
    "Bags",
    "Jewelry",
    "Watches",
    "Accessories",
  ],
  Pets: ["Dogs", "Cats", "Birds", "Fish", "Pet Food", "Pet Accessories", "Pet Care", "Pet Services"],
  Furniture: ["Sofa", "Bed", "Table", "Chair", "Wardrobe", "Desk", "Cabinet", "Dining Set", "Home Decor"],
  Jobs: ["Full Time", "Part Time", "Freelance", "Internship", "Remote Work", "Contract", "Temporary"],
  Gaming: ["Video Games", "Consoles", "PC Gaming", "Mobile Games", "Gaming Accessories", "Board Games"],
  Books: ["Fiction", "Non-Fiction", "Educational", "Comics", "Magazines", "E-books", "Audiobooks"],
  Services: ["Home Services", "Repair", "Cleaning", "Tutoring", "Photography", "Event Planning", "Transportation"],
  Other: ["Sports Equipment", "Musical Instruments", "Art & Crafts", "Collectibles", "Tools", "Garden", "Baby Items"],
}

const categorySpecificFilters = {
  Vehicles: {
    "Vehicle Type": ["Car", "Truck", "SUV", "Motorcycle", "Van", "Bus"],
    "Fuel Type": ["Petrol", "Diesel", "Electric", "Hybrid"],
    Transmission: ["Manual", "Automatic"],
    Condition: ["New", "Used", "Refurbished"],
  },
  Electronics: {
    Brand: ["Apple", "Samsung", "Sony", "LG", "Dell", "HP"],
    Type: ["Mobile", "Laptop", "Desktop", "TV", "Camera"],
    Condition: ["New", "Used", "Refurbished"],
  },
  "Real Estate": {
    "Property Type": ["Apartment", "House", "Villa", "Commercial"],
    Bedrooms: ["1 BHK", "2 BHK", "3 BHK", "4+ BHK"],
    Furnishing: ["Furnished", "Semi-Furnished", "Unfurnished"],
  },
  Fashion: {
    Gender: ["Men", "Women", "Kids", "Unisex"],
    Size: ["XS", "S", "M", "L", "XL", "XXL"],
    Condition: ["New", "Used"],
  },
}

interface SearchFiltersProps {
  searchQuery: string
}

export function SearchFilters({ searchQuery }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [priceRange, setPriceRange] = useState(() => [
    Number.parseInt(searchParams.get("minPrice") || "0"),
    Number.parseInt(searchParams.get("maxPrice") || "10000"),
  ])

  // Get current filter values directly from the URL. The URL is the source of truth.
  const selectedCategory = searchParams.get("category") || ""
  const selectedSubcategory = searchParams.get("subcategory") || ""
  const location = searchParams.get("location") || ""
  const sortBy = searchParams.get("sortBy") || "relevance"

  const categoryFilters = useMemo(() => {
    const searchParamsString = searchParams.toString()
    return Array.from(searchParams.entries()).reduce(
      (acc, [key, value]) => {
        const isCategoryFilter = Object.values(categorySpecificFilters).some((catFilters) =>
          Object.keys(catFilters)
            .map((k) => k.toLowerCase().replace(/\s+/g, "_"))
            .includes(key),
        )
        if (isCategoryFilter) {
          acc[key] = [value]
        }
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [searchParams.toString()]) // Use string representation for stable comparison

  const updateUrl = useCallback(
    (newParams: { [key: string]: string | null }) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      router.push(`/search?${params.toString()}`, { scroll: false })
    },
    [router, searchParams.toString()], // Use string representation for stable comparison
  )

  const availableSubcategories = selectedCategory ? subcategories[selectedCategory] || [] : []
  const categoryOptions = categorySpecificFilters[selectedCategory as keyof typeof categorySpecificFilters] || {}

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    router.push(`/search?${params.toString()}`)
  }, [router, searchQuery])

  const hasActiveFilters =
    selectedCategory ||
    selectedSubcategory ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    location ||
    sortBy !== "relevance" ||
    Object.keys(categoryFilters).length > 0

  return (
    <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl shadow-lg">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-xl">
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
        {!selectedCategory && (
          <>
            <div className="space-y-4">
              <Label className="text-base font-semibold text-gray-800 flex items-center">Select Category</Label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => updateUrl({ category: category, subcategory: null })}
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

        {selectedCategory && !selectedSubcategory && availableSubcategories.length > 0 && (
          <>
            <div className="space-y-4">
              <Label className="text-base font-semibold text-gray-800 flex items-center">
                Select {selectedCategory} Subcategory
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {availableSubcategories.map((subcategory) => (
                  <button
                    key={subcategory}
                    onClick={() => updateUrl({ subcategory: subcategory })}
                    className="p-3 text-left border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-sm font-medium"
                  >
                    {subcategory}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => updateUrl({ subcategory: "all" })}
                className="w-full border-2 border-green-200 hover:border-green-400 hover:bg-green-50"
              >
                Show All {selectedCategory}
              </Button>
            </div>
            <Separator className="bg-green-200" />
          </>
        )}

        {selectedCategory && (selectedSubcategory || availableSubcategories.length === 0) && (
          <>
            {Object.keys(categoryOptions).length > 0 && (
              <>
                <div className="space-y-5">
                  <Label className="text-base font-semibold text-gray-800">
                    {selectedSubcategory && selectedSubcategory !== "all" ? selectedSubcategory : selectedCategory}{" "}
                    Filters
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(categoryOptions).map(([filterType, options]) => (
                      <div key={filterType} className="flex-1 min-w-[200px] space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{filterType}</Label>
                        <Select
                          value={categoryFilters[filterType]?.[0] || "all"}
                          onValueChange={(value) => {
                            if (value === "all") {
                              updateUrl({ [filterType.toLowerCase().replace(/\s+/g, "_")]: null })
                            } else {
                              updateUrl({ [filterType.toLowerCase().replace(/\s+/g, "_")]: value })
                            }
                          }}
                        >
                          <SelectTrigger className="w-full bg-white border-2 border-gray-200 hover:border-green-400 focus:border-green-500 transition-colors">
                            <SelectValue placeholder={`Any ${filterType}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="font-medium text-gray-600">
                              Any {filterType}
                            </SelectItem>
                            {options.map((option) => (
                              <SelectItem key={option} value={option} className="hover:bg-green-50">
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
          </>
        )}

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
                onClick={() => updateUrl({ category: null, subcategory: null })}
                className="text-green-700 hover:bg-green-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

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
                updateUrl({
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
                  setPriceRange([Number.parseInt(e.target.value) || 0, priceRange[1]])
                }}
                onBlur={(e) => {
                  updateUrl({ minPrice: e.target.value > "0" ? e.target.value : null })
                }}
                className="border-2 border-gray-200 hover:border-green-400 focus:border-green-500"
              />
              <Input
                placeholder="Max Price"
                type="number"
                value={priceRange[1]}
                onChange={(e) => {
                  setPriceRange([priceRange[0], Number.parseInt(e.target.value) || 10000])
                }}
                onBlur={(e) => {
                  updateUrl({ maxPrice: e.target.value < "10000" ? e.target.value : null })
                }}
                className="border-2 border-gray-200 hover:border-green-400 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-green-200" />

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800">Location</Label>
          <Input
            placeholder="Enter city or province"
            value={location}
            onChange={(e) => {
              /* No-op, we'll use a button to apply */
            }}
            className="border-2 border-gray-200 hover:border-green-400 focus:border-green-500"
          />
        </div>

        <Separator className="bg-green-200" />

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800 flex items-center">
            <ArrowUpDown className="h-5 w-5 mr-2 text-green-600" />
            Sort By
          </Label>
          <Select value={sortBy} onValueChange={(value) => updateUrl({ sortBy: value === "relevance" ? null : value })}>
            <SelectTrigger className="w-full bg-white border-2 border-gray-200 hover:border-green-400 focus:border-green-500 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most Relevant</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="distance">Nearest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => {
            const locationInput = document.querySelector(
              'input[placeholder="Enter city or province"]',
            ) as HTMLInputElement
            if (locationInput) {
              updateUrl({ location: locationInput.value || null })
            }
          }}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
