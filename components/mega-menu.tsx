"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { 
  Car, Home, Smartphone, Shirt, Sofa, Briefcase, Wrench, Heart, Book, 
  Search, TrendingUp, Clock, Star, ChevronRight, X, Gamepad2, 
  PawPrint, Building, Utensils
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Enhanced category structure with Real Estate improvements
const CATEGORIES = [
  {
    name: "Vehicles",
    icon: Car,
    color: "text-blue-400",
    bgColor: "bg-blue-900",
    subcategories: [
      "Cars", "Motorcycles", "Bikes", "Auto Parts", 
      "Trucks", "Boats", "Heavy Vehicles", "Car Services"
    ]
  },
  {
    name: "Real Estate",
    icon: Home,
    color: "text-purple-400",
    bgColor: "bg-purple-900",
    subcategories: [
      { name: "For Rent", type: "rent", filters: ["apartment", "house", "condo", "townhouse"] },
      { name: "For Sale", type: "sale", filters: ["apartment", "house", "condo", "townhouse"] },
      "Commercial Properties",
      "Land & Plots",
      "Roommates",
      ]
  },
  {
    name: "Electronics",
    icon: Smartphone,
    color: "text-green-400",
    bgColor: "bg-green-900",
    subcategories: [
      "Mobile Phones", "Laptops & Computers", "TV & Audio", 
      "Gaming", "Cameras", "Home Appliances"
    ]
  },
  {
    name: "Fashion & Beauty",
    icon: Shirt,
    color: "text-pink-400",
    bgColor: "bg-pink-900",
    subcategories: [
      "Men", "Women", "Kids & Baby", 
      "Shoes", "Accessories", "Watches"
    ]
  },
  {
    name: "Home & Garden",
    icon: Sofa,
    color: "text-orange-400",
    bgColor: "bg-orange-900",
    subcategories: [
      "Furniture", "Home Decor", "Garden & Patio", 
      "Kitchenware", "Tools & DIY", "Lighting"
    ]
  },
  {
    name: "Jobs & Services",
    icon: Briefcase,
    color: "text-yellow-400",
    bgColor: "bg-yellow-900",
    subcategories: [
      "Full Time Jobs", "Part Time Jobs", "Freelance", 
      "Home Services", "Professional Services", "Tutoring"
    ]
  },
  {
    name: "Pets & Animals",
    icon: PawPrint,
    color: "text-red-400",
    bgColor: "bg-red-900",
    subcategories: [
      "Dogs", "Cats", "Birds", "Fish & Aquarium", 
      "Pet Supplies", "Pet Services"
    ]
  },
  {
    name: "Gaming",
    icon: Gamepad2,
    color: "text-indigo-400",
    bgColor: "bg-indigo-900",
    subcategories: [
      "Video Games", "Gaming Consoles", "PC Gaming", 
      "Board Games", "VR Equipment", "Gaming Accessories"
    ]
  },
  {
    name: "Books & Education",
    icon: Book,
    color: "text-emerald-400",
    bgColor: "bg-emerald-900",
    subcategories: [
      "Books & Magazines", "Textbooks", "E-books",
      "Educational Materials", "Language Courses", "Musical Instruments"
    ]
  },
  {
    name: "Services",
    icon: Wrench,
    color: "text-gray-400",
    bgColor: "bg-gray-900",
    subcategories: [
      "Home Services", "Professional Services", "Personal Care",
      "Business Services", "Event Services", "Transport Services"
    ]
  }
]

// Quick access items
const QUICK_ACCESS = [
  { name: "Free Items", icon: "🎁", count: "1.2k" },
  { name: "Today's Deals", icon: "🔥", count: "456" },
  { name: "Near You", icon: "📍", count: "3.4k" },
  { name: "Just Added", icon: "🆕", count: "789" }
]

interface MegaMenuProps {
  onCategorySelect?: (category: string, subcategory?: string, filters?: any) => void
  onClose?: () => void
  isOpen?: boolean
}

export default function MegaMenu({ onCategorySelect, onClose, isOpen }: MegaMenuProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const filteredCategories = CATEGORIES.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.subcategories.some(sub => 
      typeof sub === 'string' ? sub.toLowerCase().includes(searchQuery.toLowerCase()) : sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleCategoryClick = (category: string, subcategory?: string, filters?: any) => {
    if (onCategorySelect) {
      onCategorySelect(category, subcategory, filters)
    }
  }

  const handleQuickAccessClick = (item: string) => {
    setSearchQuery(item)
  }

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
    <div 
      ref={menuRef}
      className="fixed inset-x-4 top-20 z-50 w-auto max-w-6xl mx-auto bg-gray-900 shadow-2xl rounded-xl border border-gray-700"
    >
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
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white ml-4"
        >
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
              <div key={category.name} className="space-y-3">
                {/* Category Header */}
                <Link
                  href={`/search?category=${encodeURIComponent(category.name)}`}
                  className="flex items-center gap-3 font-semibold text-white hover:text-green-400 text-base group"
                  onClick={() => handleCategoryClick(category.name)}
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
                  {category.subcategories.slice(0, 6).map((sub) => {
                    const subName = typeof sub === 'string' ? sub : sub.name
                    const subType = typeof sub === 'object' ? sub.type : undefined
                    const subFilters = typeof sub === 'object' ? sub.filters : undefined

                    return (
                      <Link
                        key={subName}
                        href={`/search?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(subName)}${subType ? `&type=${subType}` : ''}`}
                        className="flex items-center gap-2 text-gray-300 hover:text-green-400 text-sm hover:bg-gray-800 px-3 py-2 rounded-md transition-colors group"
                        onClick={() => handleCategoryClick(category.name, subName, { type: subType, filters: subFilters })}
                      >
                        <span className="truncate">{subName}</span>
                        {subType && (
                          <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${subType === 'rent' ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
                            {subType}
                          </Badge>
                        )}
                      </Link>
                    )
                  })}
                  
                  {category.subcategories.length > 6 && (
                    <button className="text-xs text-gray-400 hover:text-green-400 px-3 py-1 transition-colors">
                      +{category.subcategories.length - 6} more
                    </button>
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
