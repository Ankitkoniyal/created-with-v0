"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { 
  Car, Home, Smartphone, Shirt, Sofa, Briefcase, Wrench, Book, 
  Search, TrendingUp, ChevronRight, X, Gamepad2, PawPrint 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Complete updated categories structure EXACTLY matching your database
const CATEGORIES = [
  {
    name: "Vehicles",
    slug: "vehicles",
    icon: Car,
    color: "text-blue-400",
    bgColor: "bg-blue-900",
    subcategories: [
      { name: "Cars", slug: "cars" },
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Bicycles", slug: "bicycles" },
      { name: "Scooters", slug: "scooters" },
      { name: "Auto Parts", slug: "auto-parts" }
    ]
  },
  {
    name: "Real Estate",
    slug: "real-estate", 
    icon: Home,
    color: "text-purple-400",
    bgColor: "bg-purple-900",
    subcategories: [
      { name: "For Rent", slug: "for-rent" },
      { name: "For Sale", slug: "for-sale" },
      { name: "Land", slug: "land" },
      { name: "Roommates", slug: "roommates" }
    ]
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: Smartphone,
    color: "text-green-400",
    bgColor: "bg-green-900",
    subcategories: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Laptops", slug: "laptops" },
      { name: "Computers", slug: "computers" },
      { name: "TV & Audio", slug: "tv-audio" },
      { name: "Cameras", slug: "cameras" },
      { name: "Headphones", slug: "headphones" },
      { name: "Smartphones", slug: "smartphones" },
      { name: "Tablets", slug: "tablets" }
    ]
  },
  {
    name: "Fashion & Beauty",
    slug: "fashion-beauty",
    icon: Shirt,
    color: "text-pink-400",
    bgColor: "bg-pink-900",
    subcategories: [
      { name: "Men Clothing", slug: "men-clothing" },
      { name: "Women Clothing", slug: "women-clothing" },
      { name: "Shoes", slug: "shoes" },
      { name: "Accessories", slug: "accessories" }
    ]
  },
  {
    name: "Home & Garden",
    slug: "home-garden",
    icon: Sofa,
    color: "text-orange-400",
    bgColor: "bg-orange-900",
    subcategories: [
      { name: "Furniture", slug: "furniture" },
      { name: "Home Decor", slug: "home-decor" },
      { name: "Garden & Patio", slug: "garden-patio" },
      { name: "Bedroom", slug: "bedroom" },
      { name: "Living Room", slug: "living-room" },
      { name: "Office Furniture", slug: "office-furniture" },
      { name: "Outdoor Furniture", slug: "outdoor-furniture" }
    ]
  },
  {
    name: "Jobs & Services",
    slug: "jobs-services",
    icon: Briefcase,
    color: "text-yellow-400",
    bgColor: "bg-yellow-900",
    subcategories: [
      { name: "Full Time Jobs", slug: "full-time-jobs" },
      { name: "Part Time Jobs", slug: "part-time-jobs" },
      { name: "Freelance", slug: "freelance" },
      { name: "Contract", slug: "contract-jobs" },
      { name: "Remote", slug: "remote-jobs" }
    ]
  },
  {
    name: "Pets & Animals",
    slug: "pets-animals",
    icon: PawPrint,
    color: "text-red-400",
    bgColor: "bg-red-900",
    subcategories: [
      { name: "Dogs", slug: "dogs" },
      { name: "Cats", slug: "cats" },
      { name: "Birds", slug: "birds" },
      { name: "Other Pets", slug: "other-pets" },
      { name: "Pet Supplies", slug: "pet-supplies" }
    ]
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: Gamepad2,
    color: "text-indigo-400",
    bgColor: "bg-indigo-900",
    subcategories: [
      { name: "Video Games", slug: "video-games" },
      { name: "Gaming Consoles", slug: "gaming-consoles" },
      { name: "PC Gaming", slug: "pc-gaming" },
      { name: "Board Games", slug: "board-games" },
      { name: "VR Equipment", slug: "vr-equipment" },
      { name: "Gaming Accessories", slug: "gaming-accessories" }
    ]
  },
  {
    name: "Books & Education",
    slug: "books-education",
    icon: Book,
    color: "text-emerald-400",
    bgColor: "bg-emerald-900",
    subcategories: [
      { name: "Children Books", slug: "children-books" },
      { name: "Fiction", slug: "fiction-books" },
      { name: "Non-Fiction", slug: "non-fiction-books" },
      { name: "Textbooks", slug: "textbooks" }
    ]
  },
  {
    name: "Services",
    slug: "services",
    icon: Wrench,
    color: "text-gray-400",
    bgColor: "bg-gray-900",
    subcategories: [
      { name: "Home Services", slug: "home-services" },
      { name: "Professional Services", slug: "professional-services" },
      { name: "Beauty Services", slug: "beauty-services" },
      { name: "Repair Services", slug: "repair-services" }
    ]
  },
  {
    name: "Sports",
    slug: "sports",
    icon: TrendingUp, // You might want to use a sports icon
    color: "text-teal-400",
    bgColor: "bg-teal-900",
    subcategories: [
      { name: "Exercise Equipment", slug: "exercise-equipment" },
      { name: "Outdoor Gear", slug: "outdoor-gear" },
      { name: "Sports Bikes", slug: "sports-bikes" },
      { name: "Sportswear", slug: "sportswear" }
    ]
  },
  {
    name: "Mobile",
    slug: "mobile",
    icon: Smartphone,
    color: "text-cyan-400",
    bgColor: "bg-cyan-900",
    subcategories: [
      { name: "Android Phones", slug: "android-phones" },
      { name: "iPhones", slug: "iphones" },
      { name: "Mobile Accessories", slug: "mobile-accessories" }
    ]
  },
  {
    name: "Other",
    slug: "other",
    icon: Wrench,
    color: "text-gray-400",
    bgColor: "bg-gray-900",
    subcategories: [
      { name: "Free Stuff", slug: "free-stuff" },
      { name: "Lost & Found", slug: "lost-found" },
      { name: "Miscellaneous", slug: "miscellaneous" }
    ]
  }
]

interface MegaMenuProps {
  onClose?: () => void
  isOpen?: boolean
}

export default function MegaMenu({ onClose, isOpen }: MegaMenuProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const filteredCategories = CATEGORIES.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.subcategories.some(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div ref={menuRef} className="fixed inset-x-4 top-20 z-50 w-auto max-w-6xl mx-auto bg-gray-900 shadow-2xl rounded-xl border border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white ml-4">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {searchQuery && (
          <div className="mb-4 text-sm text-gray-400">
            Found {filteredCategories.length} categories matching "{searchQuery}"
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category) => {
            const IconComponent = category.icon
            
            return (
              <div key={category.slug} className="space-y-3">
                {/* Category Header */}
                <Link
                  href={`/search?category=${category.slug}`}
                  className="flex items-center gap-3 font-semibold text-white hover:text-green-400 text-base group"
                  onClick={onClose}
                >
                  <div className={`w-10 h-10 ${category.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`w-5 h-5 ${category.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{category.name}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-400" />
                  </div>
                </Link>

                {/* Subcategories */}
                <div className="space-y-1.5 ml-13">
                  {category.subcategories.slice(0, 6).map((subcategory) => (
                    <Link
                      key={subcategory.slug}
                      href={`/search?category=${category.slug}&subcategory=${subcategory.slug}`}
                      className="flex items-center gap-2 text-gray-300 hover:text-green-400 text-sm hover:bg-gray-800 px-3 py-2 rounded-md transition-colors group"
                      onClick={onClose}
                    >
                      <span className="truncate">{subcategory.name}</span>
                    </Link>
                  ))}
                  
                  {category.subcategories.length > 6 && (
                    <Link
                      href={`/search?category=${category.slug}`}
                      className="text-xs text-gray-400 hover:text-green-400 px-3 py-1 transition-colors block"
                      onClick={onClose}
                    >
                      +{category.subcategories.length - 6} more
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No categories found</h3>
            <p className="text-gray-400">Try searching with different keywords</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 bg-gray-800 px-6 py-4 rounded-b-xl">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-gray-300">Popular:</span>
          <div className="flex gap-4">
            {["Apartments for Rent", "Used Cars", "iPhone", "Jobs", "Furniture"].map((item) => (
              <Link
                key={item}
                href={`/search?q=${encodeURIComponent(item)}`}
                className="text-sm text-gray-400 hover:text-green-400 hover:underline"
                onClick={onClose}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
