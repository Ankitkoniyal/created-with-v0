"use client"
import Link from "next/link"
import { Car, Home, Smartphone, Shirt, Sofa, Briefcase, Wrench, Heart, Book } from "lucide-react"

const CATEGORY_ICONS = {
  Vehicles: Car,
  "Real Estate": Home,
  Electronics: Smartphone,
  Fashion: Shirt,
  Furniture: Sofa,
  Jobs: Briefcase,
  Services: Wrench,
  Pets: Heart,
  "Books & Hobbies": Book,
}

const SIMPLIFIED_CATEGORIES = {
  Vehicles: ["Cars", "Motorcycles", "Bikes", "Parts & Accessories"],
  "Real Estate": ["For Sale", "For Rent", "Commercial", "Vacation Rentals"],
  Electronics: ["Mobile Phones", "Computers", "TV & Audio", "Gaming", "Home Appliances"],
  Fashion: ["Men's Clothing", "Women's Clothing", "Kids & Baby", "Shoes & Accessories"],
  Furniture: ["Living Room", "Bedroom", "Dining Room", "Office", "Outdoor"],
  Jobs: ["Full Time", "Part Time", "Freelance", "Internships"],
  Services: ["Home Services", "Professional", "Personal Care", "Business"],
  Pets: ["Dogs", "Cats", "Birds", "Fish", "Pet Supplies"],
  "Books & Hobbies": ["Books", "Sports & Fitness", "Music", "Art & Crafts"],
}

interface MegaMenuProps {
  onCategorySelect?: (category: string, subcategory?: string) => void
}

export function MegaMenu({ onCategorySelect }: MegaMenuProps) {
  const handleCategoryClick = (category: string, subcategory?: string) => {
    if (onCategorySelect) {
      onCategorySelect(category, subcategory)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-black shadow-lg rounded-lg border border-gray-700">
      <div className="border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">Browse Categories</h3>
        <p className="text-sm text-gray-300">Find what you're looking for</p>
      </div>

      <div className="p-6 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-3 gap-8">
          {Object.entries(SIMPLIFIED_CATEGORIES).map(([category, subcategories]) => {
            const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]

            return (
              <div key={category} className="space-y-4">
                <Link
                  href={`/search?category=${encodeURIComponent(category)}`}
                  className="flex items-center gap-3 font-semibold text-white hover:text-green-400 text-base group transition-colors"
                  onClick={() => handleCategoryClick(category)}
                >
                  {IconComponent && (
                    <div className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center group-hover:bg-green-800 transition-colors">
                      <IconComponent className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  <span>{category}</span>
                </Link>

                <div className="space-y-2 ml-11">
                  {subcategories.map((subcat) => (
                    <Link
                      key={subcat}
                      href={`/search?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcat)}`}
                      className="block text-gray-300 hover:text-green-400 text-sm hover:bg-gray-800 px-3 py-2 rounded-md transition-colors"
                      onClick={() => handleCategoryClick(category, subcat)}
                    >
                      {subcat}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-gray-700 bg-gray-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-300">Popular:</span>
          {["Cars", "Mobile Phones", "Apartments", "Jobs"].map((popular) => (
            <Link
              key={popular}
              href={`/search?q=${encodeURIComponent(popular.toLowerCase())}`}
              className="text-sm text-gray-400 hover:text-green-400 hover:underline transition-colors"
            >
              {popular}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
