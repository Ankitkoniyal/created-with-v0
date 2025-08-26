"use client"
import Link from "next/link"
import { Search, Car, Home, Smartphone, Shirt, Sofa, Briefcase, Wrench, Heart, Book, TrendingUp } from "lucide-react"
import { useState } from "react"

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

const TRENDING_CATEGORIES = ["Electronics", "Vehicles", "Real Estate"]

const MEGA_MENU_CATEGORIES = {
  Vehicles: {
    Cars: ["Sedan", "SUV", "Hatchback", "Convertible", "Coupe", "Wagon"],
    Bikes: ["Sport Bikes", "Cruiser", "Touring", "Off-Road", "Scooters"],
    Motorcycles: ["Street", "Sport", "Touring", "Cruiser", "Adventure"],
    "Commercial Vehicles": ["Trucks", "Vans", "Buses", "Trailers"],
    "Spare Parts": ["Engine Parts", "Body Parts", "Electrical", "Tires", "Accessories"],
    "Other Vehicles": ["Boats", "RVs", "ATVs", "Snowmobiles"],
  },
  "Real Estate": {
    "For Sale": ["Houses", "Apartments", "Condos", "Townhouses", "Land"],
    "For Rent": ["Houses", "Apartments", "Rooms", "Commercial Space"],
    Commercial: ["Office Space", "Retail", "Warehouse", "Industrial"],
    "Vacation Rentals": ["Cottages", "Cabins", "Short Term Rentals"],
  },
  Electronics: {
    "Mobile Phones": ["iPhone", "Samsung", "Google Pixel", "OnePlus", "Accessories"],
    Computers: ["Laptops", "Desktops", "Tablets", "Accessories"],
    "TV & Audio": ["Smart TVs", "Speakers", "Headphones", "Home Theater"],
    Gaming: ["Consoles", "Games", "Accessories", "PC Gaming"],
    Cameras: ["DSLR", "Mirrorless", "Action Cameras", "Lenses"],
    "Home Appliances": ["Kitchen", "Laundry", "Cleaning", "Small Appliances"],
  },
  Fashion: {
    Men: ["Clothing", "Shoes", "Accessories", "Watches", "Bags"],
    Women: ["Clothing", "Shoes", "Accessories", "Jewelry", "Bags"],
    Kids: ["Boys Clothing", "Girls Clothing", "Shoes", "Toys"],
    Accessories: ["Watches", "Jewelry", "Sunglasses", "Belts"],
  },
  Furniture: {
    "Living Room": ["Sofas", "Coffee Tables", "TV Stands", "Chairs"],
    Bedroom: ["Beds", "Mattresses", "Wardrobes", "Dressers"],
    "Dining Room": ["Dining Tables", "Chairs", "Cabinets", "Bar Stools"],
    Office: ["Desks", "Chairs", "Storage", "Lighting"],
    Outdoor: ["Patio Furniture", "Garden", "BBQ", "Umbrellas"],
  },
  Jobs: {
    "Full Time": ["IT", "Sales", "Marketing", "Finance", "Healthcare"],
    "Part Time": ["Retail", "Food Service", "Customer Service", "Delivery"],
    Freelance: ["Writing", "Design", "Programming", "Consulting"],
    Internships: ["Student Jobs", "Entry Level", "Training Programs"],
  },
  Services: {
    "Home Services": ["Cleaning", "Plumbing", "Electrical", "Renovation"],
    Professional: ["Legal", "Accounting", "Consulting", "Education"],
    Personal: ["Beauty", "Fitness", "Pet Care", "Tutoring"],
    Business: ["Marketing", "IT Support", "Delivery", "Catering"],
  },
  Pets: {
    Dogs: ["Puppies", "Adult Dogs", "Dog Accessories", "Dog Food"],
    Cats: ["Kittens", "Adult Cats", "Cat Accessories", "Cat Food"],
    Birds: ["Parrots", "Canaries", "Bird Cages", "Bird Food"],
    Fish: ["Tropical Fish", "Aquariums", "Fish Food", "Accessories"],
    "Other Pets": ["Rabbits", "Hamsters", "Reptiles", "Pet Supplies"],
  },
  "Books & Hobbies": {
    Books: ["Fiction", "Non-Fiction", "Textbooks", "Children's Books"],
    Sports: ["Fitness Equipment", "Outdoor Sports", "Team Sports"],
    Music: ["Instruments", "Audio Equipment", "Sheet Music"],
    "Art & Crafts": ["Supplies", "Paintings", "Handmade Items"],
    Collectibles: ["Coins", "Stamps", "Antiques", "Memorabilia"],
  },
}

interface MegaMenuProps {
  onCategorySelect?: (category: string, subcategory?: string) => void
}

export function MegaMenu({ onCategorySelect }: MegaMenuProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})

  const handleCategoryClick = (category: string, subcategory?: string) => {
    if (onCategorySelect) {
      onCategorySelect(category, subcategory)
    }
  }

  const filteredCategories = Object.entries(MEGA_MENU_CATEGORIES).filter(([category, subcategories]) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()

    // Search in category name
    if (category.toLowerCase().includes(searchLower)) return true

    // Search in subcategories and items
    return Object.entries(subcategories).some(
      ([subcat, items]) =>
        subcat.toLowerCase().includes(searchLower) || items.some((item) => item.toLowerCase().includes(searchLower)),
    )
  })

  return (
    <div className="w-full max-w-7xl mx-auto bg-white shadow-lg rounded-lg border">
      <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100 p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
          {["iPhone", "Tesla", "Lotto Max", "Urgent Sale"].map((filter) => (
            <Link
              key={filter}
              href={`/search?q=${encodeURIComponent(filter.toLowerCase())}`}
              className="px-3 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              {filter}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="grid grid-cols-4 gap-6 p-6">
          {filteredCategories.map(([category, subcategories]) => {
            const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
            const isPopular = TRENDING_CATEGORIES.includes(category)
            const adCount = categoryCounts[category] || 0

            return (
              <div key={category} className="space-y-3">
                <Link
                  href={`/search?category=${encodeURIComponent(category)}`}
                  className="flex items-center gap-2 font-bold text-green-800 hover:text-green-900 text-sm border-b border-green-100 pb-2 hover:bg-green-50 px-2 py-2 rounded transition-colors group"
                  onClick={() => handleCategoryClick(category)}
                >
                  {IconComponent && <IconComponent className="w-4 h-4 text-green-600 group-hover:text-green-700" />}
                  <span className="flex-1">{category}</span>
                  {isPopular && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-orange-500" />
                      <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                        Hot
                      </span>
                    </div>
                  )}
                </Link>

                {adCount > 0 && (
                  <div className="text-xs text-gray-500 px-2 mb-2">{adCount.toLocaleString()} ads available</div>
                )}

                <div className="space-y-1">
                  {Object.entries(subcategories).map(([subcat, items]) => (
                    <div key={subcat} className="space-y-1">
                      <Link
                        href={`/search?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcat)}`}
                        className="block font-medium text-gray-700 hover:text-green-700 text-xs hover:bg-green-50 px-2 py-1 rounded transition-colors"
                        onClick={() => handleCategoryClick(category, subcat)}
                      >
                        {subcat}
                      </Link>
                      <div className="ml-2 space-y-0.5">
                        {items.slice(0, 4).map((item) => (
                          <Link
                            key={item}
                            href={`/search?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcat)}&item=${encodeURIComponent(item)}`}
                            className="block text-gray-500 hover:text-green-600 text-xs hover:bg-green-50 px-2 py-0.5 rounded transition-colors"
                            onClick={() => handleCategoryClick(category, item)}
                          >
                            {item}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {filteredCategories.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No categories found for "{searchTerm}"</p>
            <p className="text-sm">Try searching with different keywords</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-gradient-to-r from-green-50 to-green-100 px-6 py-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Most Popular:</span>
          </div>
          {["Cars", "Mobile Phones", "Apartments", "Jobs", "Electronics", "Fashion"].map((popular) => (
            <Link
              key={popular}
              href={`/search?category=${encodeURIComponent(popular)}`}
              className="text-sm text-gray-700 hover:text-green-700 hover:underline bg-white px-2 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
              onClick={() => handleCategoryClick(popular)}
            >
              {popular}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
