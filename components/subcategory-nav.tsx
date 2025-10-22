// components/subcategory-nav.tsx - UPDATED
"use client"

import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { SUBCATEGORY_MAPPINGS } from "@/lib/categories" // We'll create this

interface SubcategoryNavProps {
  category: string
  selectedSubcategory?: string
}

// Updated subcategory mappings based on your new structure
const SUBCATEGORY_MAPPINGS: { [key: string]: string[] } = {
  // Home Appliances
  "Home Appliances": [
    "Coffee Makers", "Cookers", "Dishwashers", "Heaters", "Irons", 
    "Microwaves", "Juicers & Blenders", "Refrigerators & Freezers", 
    "Gas Stoves", "Ovens", "Toasters", "Vacuums"
  ],
  
  // Electronics
  "Electronics": [
    "Tablets", "Laptops", "Headphones", "Computers", "Cameras", "TV & Audio"
  ],
  
  // Services
  "Services": [
    "Nanny & Childcare", "Cleaners", "Financial & Legal", "Personal Trainer",
    "Food & Catering", "Health & Beauty", "Moving & Storage", "Music Lessons",
    "Photography & Video", "Skilled Trades", "Tutors & Languages", "Wedding"
  ],
  
  // Vehicles
  "Vehicles": [
    "Cars", "Trucks", "Classic Cars", "Auto Parts", "Trailers", 
    "Scooters", "Bicycles", "Motorcycles"
  ],
  
  // Furniture
  "Furniture": [
    "Beds & Mattresses", "Book Shelves", "Chairs & Recliners", "Coffee Tables",
    "Sofa & Couches", "Dining Tables", "Wardrobes", "TV Tables"
  ],
  
  // Mobile
  "Mobile": [
    "Mobile Accessories", "Android Phones", "iPhones"
  ],
  
  // Real Estate
  "Real Estate": [
    "Roommates", "For Rent", "For Sale", "Land"
  ],
  
  // Fashion & Beauty
  "Fashion & Beauty": [
    "Shoes", "Accessories", "Women Clothing", "Men Clothing"
  ],
  
  // Pets & Animals
  "Pets & Animals": [
    "Cats", "Birds", "Other Pets", "Dogs", "Pet Supplies"
  ],
  
  // Sports
  "Sports": [
    "Exercise Equipment", "Sportswear", "Outdoor Gear"
  ],
  
  // Books & Education
  "Books & Education": [
    "Fiction", "Textbooks", "Children Books", "Non-Fiction"
  ],
  
  // Free Stuff
  "Free Stuff": [
    "Lost & Found", "Miscellaneous"
  ]
}

export function SubcategoryNav({ category, selectedSubcategory }: SubcategoryNavProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateUrl = useCallback(
    (subcategory: string | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (subcategory === null || subcategory === "all") {
        params.delete("subcategory")
      } else {
        params.set("subcategory", subcategory)
      }

      router.push(`/search?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  // Get available subcategories for the current category
  const availableSubcategories = SUBCATEGORY_MAPPINGS[category] || []

  if (!category || availableSubcategories.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse {category} Categories</h3>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={!selectedSubcategory || selectedSubcategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => updateUrl("all")}
            className={`${
              !selectedSubcategory || selectedSubcategory === "all"
                ? "bg-green-900 hover:bg-green-950 text-white"
                : "border-gray-300 hover:border-green-400 hover:bg-green-50"
            }`}
          >
            All {category}
          </Button>

          {availableSubcategories.map((subcategory) => (
            <Button
              key={subcategory}
              variant={selectedSubcategory === subcategory ? "default" : "outline"}
              size="sm"
              onClick={() => updateUrl(subcategory)}
              className={`${
                selectedSubcategory === subcategory
                  ? "bg-green-900 hover:bg-green-950 text-white"
                  : "border-gray-300 hover:border-green-400 hover:bg-green-50"
              }`}
            >
              {subcategory}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
