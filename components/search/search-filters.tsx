"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { X, Filter, MapPin, DollarSign, Star } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

const categories = [
  "Electronics",
  "Vehicles",
  "Real Estate",
  "Fashion",
  "Gaming",
  "Books",
  "Services",
  "Home & Garden",
  "Sports",
  "Collectibles",
]

const conditions = ["New", "Like New", "Excellent", "Very Good", "Good", "Fair"]

const locations = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
]

const categorySpecificFilters = {
  Vehicles: {
    "Vehicle Type": ["Car", "Truck", "SUV", "Motorcycle", "Van", "Bus", "Trailer"],
    "Fuel Type": ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "LPG"],
    Transmission: ["Manual", "Automatic", "CVT"],
    Ownership: ["First Owner", "Second Owner", "Third Owner", "Fourth+ Owner"],
    "KM Driven": ["0-10,000", "10,000-25,000", "25,000-50,000", "50,000-75,000", "75,000-100,000", "100,000+"],
    Year: ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "Older"],
  },
  Electronics: {
    Brand: ["Apple", "Samsung", "Sony", "LG", "Dell", "HP", "Lenovo", "Asus", "Canon", "Nikon"],
    Type: ["Mobile", "Laptop", "Desktop", "TV", "Camera", "Gaming Console", "Headphones", "Speakers"],
    "Screen Size": ['Under 5"', '5-6"', '6-7"', '13-15"', '15-17"', '17-20"', '20-24"', '24-27"', '27"+'],
    Storage: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB+"],
    RAM: ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB", "32GB+"],
  },
  "Real Estate": {
    "Property Type": ["Apartment", "House", "Villa", "Plot", "Commercial", "Office", "Shop", "Warehouse"],
    Bedrooms: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK"],
    Bathrooms: ["1", "2", "3", "4", "5+"],
    Furnishing: ["Furnished", "Semi-Furnished", "Unfurnished"],
    "Area (sq ft)": ["Under 500", "500-1000", "1000-1500", "1500-2000", "2000-3000", "3000+"],
    Parking: ["No Parking", "1 Car", "2 Cars", "3+ Cars"],
  },
  Fashion: {
    Gender: ["Men", "Women", "Kids", "Unisex"],
    Category: ["Clothing", "Shoes", "Accessories", "Bags", "Watches", "Jewelry"],
    Size: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    Brand: ["Nike", "Adidas", "Zara", "H&M", "Gucci", "Prada", "Louis Vuitton", "Chanel"],
    Color: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Brown", "Gray"],
    Material: ["Cotton", "Polyester", "Leather", "Silk", "Wool", "Denim", "Linen"],
  },
  Gaming: {
    Platform: ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile"],
    Genre: ["Action", "Adventure", "RPG", "Sports", "Racing", "Strategy", "Puzzle", "Simulation"],
    "Age Rating": ["E (Everyone)", "T (Teen)", "M (Mature)", "A (Adults Only)"],
    Type: ["Games", "Consoles", "Accessories", "Controllers", "Headsets"],
  },
  Books: {
    Genre: ["Fiction", "Non-Fiction", "Mystery", "Romance", "Sci-Fi", "Fantasy", "Biography", "History"],
    Language: ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Other"],
    Format: ["Paperback", "Hardcover", "E-book", "Audiobook"],
    Author: ["Popular Authors", "Classic Authors", "Contemporary Authors"],
  },
  Sports: {
    Sport: ["Cricket", "Football", "Basketball", "Tennis", "Badminton", "Swimming", "Cycling", "Gym"],
    Type: ["Equipment", "Clothing", "Shoes", "Accessories", "Supplements"],
    Brand: ["Nike", "Adidas", "Puma", "Reebok", "Under Armour", "Wilson", "Spalding"],
  },
  "Home & Garden": {
    Category: ["Furniture", "Appliances", "Decor", "Kitchen", "Garden", "Tools", "Lighting"],
    Room: ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Dining Room", "Office", "Garden"],
    Material: ["Wood", "Metal", "Plastic", "Glass", "Fabric", "Leather", "Stone"],
    Brand: ["IKEA", "Ashley", "Wayfair", "West Elm", "Pottery Barn"],
  },
}

interface SearchFiltersProps {
  currentFilters: {
    category: string
    minPrice: string
    maxPrice: string
    condition: string
    location: string
    sortBy: string
  }
  searchQuery: string
}

export function SearchFilters({ currentFilters, searchQuery }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState(currentFilters)
  const [priceRange, setPriceRange] = useState([
    Number.parseInt(currentFilters.minPrice) || 0,
    Number.parseInt(currentFilters.maxPrice) || 10000,
  ])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentFilters.category ? [currentFilters.category] : [],
  )
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    currentFilters.condition ? [currentFilters.condition] : [],
  )

  const [categoryFilters, setCategoryFilters] = useState<Record<string, string[]>>({})

  const selectedCategory = selectedCategories[0] || ""
  const categoryOptions = categorySpecificFilters[selectedCategory as keyof typeof categorySpecificFilters] || {}

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (searchQuery) params.set("q", searchQuery)
    if (selectedCategories.length > 0) params.set("category", selectedCategories[0])
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString())
    if (priceRange[1] < 10000) params.set("maxPrice", priceRange[1].toString())
    if (selectedConditions.length > 0) params.set("condition", selectedConditions[0])
    if (filters.location) params.set("location", filters.location)
    if (filters.sortBy !== "relevance") params.set("sortBy", filters.sortBy)

    Object.entries(categoryFilters).forEach(([filterType, values]) => {
      if (values.length > 0) {
        params.set(filterType.toLowerCase().replace(/\s+/g, "_"), values[0])
      }
    })

    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedConditions([])
    setPriceRange([0, 10000])
    setCategoryFilters({}) // Clear category-specific filters
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      condition: "",
      location: "",
      sortBy: "relevance",
    })

    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    router.push(`/search?${params.toString()}`)
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedConditions.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    filters.location ||
    filters.sortBy !== "relevance" ||
    Object.keys(categoryFilters).length > 0 // Include category filters in active check

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="hover:bg-green-100 hover:text-green-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sort By */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Sort By</Label>
          <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
            <SelectTrigger className="hover:bg-green-50 hover:border-green-200">
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

        <Separator />

        {/* Categories */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Categories</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories([category])
                      setCategoryFilters({}) // Reset category filters when category changes
                    } else {
                      setSelectedCategories([])
                      setCategoryFilters({}) // Reset category filters when category is cleared
                    }
                  }}
                />
                <Label htmlFor={category} className="text-sm font-normal hover:text-green-700 cursor-pointer">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {selectedCategory && Object.keys(categoryOptions).length > 0 && (
          <>
            <div className="space-y-4">
              <Label className="text-sm font-medium text-green-700">{selectedCategory} Filters</Label>
              {Object.entries(categoryOptions).map(([filterType, options]) => (
                <div key={filterType} className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">{filterType}</Label>
                  <Select
                    value={categoryFilters[filterType]?.[0] || "any"} // Set default value to "any"
                    onValueChange={(value) => {
                      if (value) {
                        setCategoryFilters((prev) => ({
                          ...prev,
                          [filterType]: [value],
                        }))
                      } else {
                        setCategoryFilters((prev) => {
                          const newFilters = { ...prev }
                          delete newFilters[filterType]
                          return newFilters
                        })
                      }
                    }}
                  >
                    <SelectTrigger className="hover:bg-green-50 hover:border-green-200">
                      <SelectValue placeholder={`Any ${filterType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any {filterType}</SelectItem> // Set value to "any"
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
            <Separator />
          </>
        )}

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            Price Range
          </Label>
          <div className="px-2">
            <Slider value={priceRange} onValueChange={setPriceRange} max={10000} min={0} step={50} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Min"
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number.parseInt(e.target.value) || 0, priceRange[1]])}
              className="hover:border-green-200 focus:border-green-500"
            />
            <Input
              placeholder="Max"
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value) || 10000])}
              className="hover:border-green-200 focus:border-green-500"
            />
          </div>
        </div>

        <Separator />

        {/* Condition */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center">
            <Star className="h-4 w-4 mr-1" />
            Condition
          </Label>
          <div className="space-y-2">
            {conditions.map((condition) => (
              <div key={condition} className="flex items-center space-x-2">
                <Checkbox
                  id={condition}
                  checked={selectedConditions.includes(condition)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedConditions([condition])
                    } else {
                      setSelectedConditions([])
                    }
                  }}
                />
                <Label htmlFor={condition} className="text-sm font-normal hover:text-green-700 cursor-pointer">
                  {condition}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Location */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            Location
          </Label>
          <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value })}>
            <SelectTrigger className="hover:bg-green-50 hover:border-green-200">
              <SelectValue placeholder="Any location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any location</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={applyFilters} className="w-full bg-green-800 hover:bg-green-900">
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  )
}
