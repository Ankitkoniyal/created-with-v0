"use client"
import Link from "next/link"

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
  const handleCategoryClick = (category: string, subcategory?: string) => {
    if (onCategorySelect) {
      onCategorySelect(category, subcategory)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="max-h-96 overflow-y-auto">
        <div className="grid grid-cols-4 gap-6 p-6">
          {Object.entries(MEGA_MENU_CATEGORIES).map(([category, subcategories]) => (
            <div key={category} className="space-y-3">
              <Link
                href={`/search?category=${encodeURIComponent(category)}`}
                className="block font-bold text-green-800 hover:text-green-900 text-sm border-b border-green-100 pb-2 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </Link>
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
          ))}
        </div>
      </div>

      {/* Popular Categories Footer */}
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
        <div className="flex flex-wrap gap-4">
          <span className="text-sm font-medium text-gray-600">Popular:</span>
          {["Cars", "Mobile Phones", "Apartments", "Jobs", "Electronics", "Fashion"].map((popular) => (
            <Link
              key={popular}
              href={`/search?category=${encodeURIComponent(popular)}`}
              className="text-sm text-green-700 hover:text-green-800 hover:underline"
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
