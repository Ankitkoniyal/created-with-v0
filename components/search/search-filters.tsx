"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { X, Filter, DollarSign, ArrowUpDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

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
    "Vehicle Type": ["Car", "Truck", "SUV", "Motorcycle", "Van", "Bus", "Trailer"],
    "Fuel Type": ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "LPG"],
    Transmission: ["Manual", "Automatic", "CVT"],
    Ownership: ["First Owner", "Second Owner", "Third Owner", "Fourth+ Owner"],
    "KM Driven": ["0-10,000", "10,000-25,000", "25,000-50,000", "50,000-75,000", "75,000-100,000", "100,000+"],
    Year: ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "Older"],
    Condition: ["New", "Used", "Refurbished", "Damaged", "Other"],
  },
  Electronics: {
    Brand: ["Apple", "Samsung", "Sony", "LG", "Dell", "HP", "Lenovo", "Asus", "Canon", "Nikon"],
    Type: ["Mobile", "Laptop", "Desktop", "TV", "Camera", "Gaming Console", "Headphones", "Speakers"],
    "Screen Size": ['Under 5"', '5-6"', '6-7"', '13-15"', '15-17"', '17-20"', '20-24"', '24-27"', '27"+'],
    Storage: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB+"],
    RAM: ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB", "32GB+"],
    Condition: ["New", "Used", "Refurbished", "Damaged", "Other"],
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
    Condition: ["New", "Used", "Refurbished", "Damaged", "Other"],
  },
  Gaming: {
    Platform: ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile"],
    Genre: ["Action", "Adventure", "RPG", "Sports", "Racing", "Strategy", "Puzzle", "Simulation"],
    "Age Rating": ["E (Everyone)", "T (Teen)", "M (Mature)", "A (Adults Only)"],
    Type: ["Games", "Consoles", "Accessories", "Controllers", "Headsets"],
    Condition: ["New", "Used", "Refurbished", "Damaged", "Other"],
  },
  Books: {
    Genre: ["Fiction", "Non-Fiction", "Mystery", "Romance", "Sci-Fi", "Fantasy", "Biography", "History"],
    Language: ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Other"],
    Format: ["Paperback", "Hardcover", "E-book", "Audiobook"],
    Author: ["Popular Authors", "Classic Authors", "Contemporary Authors"],
    Condition: ["New", "Used", "Refurbished", "Damaged", "Other"],
  },
  Other: {
    Sport: ["Cricket", "Football", "Basketball", "Tennis", "Badminton", "Swimming", "Cycling", "Gym"],
    Type: ["Equipment", "Clothing", "Shoes", "Accessories", "Supplements"],
    Brand: ["Nike", "Adidas", "Puma", "Reebok", "Under Armour", "Wilson", "Spalding"],
    Condition: ["New", "Used", "Refurbished", "Damaged", "Other"],
  },
  Furniture: {
    Category: ["Furniture", "Appliances", "Decor", "Kitchen", "Garden", "Tools", "Lighting"],
    Room: ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Dining Room", "Office", "Garden"],
    Material: ["Wood", "Metal", "Plastic", "Glass", "Fabric", "Leather", "Stone"],
    Brand: ["IKEA", "Ashley", "Wayfair", "West Elm", "Pottery Barn"],
    Condition: ["New", "Used", "Refurbished", "Damaged", "Other"],
  },
}

interface SearchFiltersProps {
  currentFilters: {
    category: string
    subcategory: string
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
  const [selectedCategory, setSelectedCategory] = useState<string>(currentFilters.category || "")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(currentFilters.subcategory || "")
  const [categoryFilters, setCategoryFilters] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category") || currentFilters.category || ""
    const subcategoryFromUrl = searchParams.get("subcategory") || currentFilters.subcategory || ""
    setSelectedCategory(categoryFromUrl)
    setSelectedSubcategory(subcategoryFromUrl)
  }, [searchParams, currentFilters.category, currentFilters.subcategory])

  const availableSubcategories = selectedCategory ? subcategories[selectedCategory] || [] : []
  const categoryOptions = categorySpecificFilters[selectedCategory as keyof typeof categorySpecificFilters] || {}

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (searchQuery) params.set("q", searchQuery)
    if (selectedSubcategory) {
      params.set("subcategory", selectedSubcategory)
      params.set("category", selectedCategory)
    } else if (selectedCategory) {
      params.set("category", selectedCategory)
    }
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString())
    if (priceRange[1] < 10000) params.set("maxPrice", priceRange[1].toString())
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
    setSelectedCategory("")
    setSelectedSubcategory("")
    setPriceRange([0, 10000])
    setCategoryFilters({})
    setFilters({
      category: "",
      subcategory: "",
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
    selectedCategory ||
    selectedSubcategory ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    filters.location ||
    filters.sortBy !== "relevance" ||
    Object.values(categoryFilters).some((values) => values.length > 0)

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
                    onClick={() => {
                      setSelectedCategory(category)
                      setSelectedSubcategory("")
                      setCategoryFilters({})
                    }}
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
                    onClick={() => {
                      setSelectedSubcategory(subcategory)
                      setCategoryFilters({})
                    }}
                    className="p-3 text-left border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-sm font-medium"
                  >
                    {subcategory}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSubcategory("all")
                  setCategoryFilters({})
                }}
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
                              setCategoryFilters((prev) => {
                                const newFilters = { ...prev }
                                delete newFilters[filterType]
                                return newFilters
                              })
                            } else {
                              setCategoryFilters((prev) => ({
                                ...prev,
                                [filterType]: [value],
                              }))
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
                onClick={() => {
                  setSelectedCategory("")
                  setSelectedSubcategory("")
                  setCategoryFilters({})
                }}
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
                onChange={(e) => setPriceRange([Number.parseInt(e.target.value) || 0, priceRange[1]])}
                className="border-2 border-gray-200 hover:border-green-400 focus:border-green-500"
              />
              <Input
                placeholder="Max Price"
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value) || 10000])}
                className="border-2 border-gray-200 hover:border-green-400 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-green-200" />

        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-800 flex items-center">
            <ArrowUpDown className="h-5 w-5 mr-2 text-green-600" />
            Sort By
          </Label>
          <Select
            value={filters.sortBy || "relevance"}
            onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
          >
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
          onClick={applyFilters}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
