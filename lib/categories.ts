export interface CategoryData {
  name: string
  subcategories: string[]
  filters: Record<string, string[]>
}

export const UNIFIED_CATEGORIES: CategoryData[] = [
  {
    name: "Vehicles",
    subcategories: [
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
    filters: {
      "Vehicle Type": ["Car", "Truck", "SUV", "Motorcycle", "Van", "Bus", "Bicycle", "Scooter", "Boat", "RV", "ATV"],
      "Fuel Type": ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"],
      Transmission: ["Manual", "Automatic", "CVT"],
      Condition: ["New", "Used", "Certified Pre-Owned"],
      Year: ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "Older"],
    },
  },
  {
    name: "Electronics",
    subcategories: [
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
    filters: {
      Brand: ["Apple", "Samsung", "Sony", "LG", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI"],
      Type: ["Desktop", "Laptop", "Tablet", "TV", "Camera", "Audio", "Home Appliance"],
      Condition: ["New", "Used", "Refurbished", "Open Box"],
      "Screen Size": ['Under 15"', '15-17"', '17-20"', '20-24"', '24-27"', '27-32"', '32"+'],
    },
  },
  {
    name: "Mobile",
    subcategories: [
      "Smartphones",
      "Tablets",
      "Accessories",
      "Cases & Covers",
      "Chargers",
      "Headphones",
      "Smart Watches",
      "Power Banks",
    ],
    filters: {
      Brand: ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Huawei", "Oppo", "Vivo"],
      Storage: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"],
      Condition: ["New", "Used", "Refurbished"],
      Network: ["Unlocked", "Rogers", "Bell", "Telus", "Freedom", "Fido"],
    },
  },
  {
    name: "Real Estate",
    subcategories: [
      "Houses",
      "Apartments",
      "Commercial",
      "Land",
      "Rental",
      "Vacation Rentals",
      "Office Space",
      "Warehouse",
    ],
    filters: {
      "Property Type": ["House", "Apartment", "Condo", "Townhouse", "Villa", "Commercial", "Land"],
      Bedrooms: ["Studio", "1 Bedroom", "2 Bedrooms", "3 Bedrooms", "4 Bedrooms", "5+ Bedrooms"],
      Bathrooms: ["1 Bathroom", "1.5 Bathrooms", "2 Bathrooms", "2.5 Bathrooms", "3+ Bathrooms"],
      Furnishing: ["Furnished", "Semi-Furnished", "Unfurnished"],
      Parking: ["No Parking", "1 Space", "2 Spaces", "3+ Spaces"],
    },
  },
  {
    name: "Fashion",
    subcategories: [
      "Men's Clothing",
      "Women's Clothing",
      "Kids Clothing",
      "Shoes",
      "Bags",
      "Jewelry",
      "Watches",
      "Accessories",
    ],
    filters: {
      Gender: ["Men", "Women", "Kids", "Unisex"],
      Size: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
      Condition: ["New with Tags", "New without Tags", "Used - Excellent", "Used - Good", "Used - Fair"],
      Brand: ["Nike", "Adidas", "Zara", "H&M", "Uniqlo", "Levi's", "Calvin Klein", "Tommy Hilfiger"],
    },
  },
  {
    name: "Pets",
    subcategories: ["Dogs", "Cats", "Birds", "Fish", "Pet Food", "Pet Accessories", "Pet Care", "Pet Services"],
    filters: {
      "Pet Type": ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Hamster", "Guinea Pig", "Reptile"],
      Age: ["Puppy/Kitten", "Young", "Adult", "Senior"],
      Size: ["Small", "Medium", "Large", "Extra Large"],
      Breed: ["Mixed", "Purebred"],
      Gender: ["Male", "Female"],
    },
  },
  {
    name: "Furniture",
    subcategories: ["Sofa", "Bed", "Table", "Chair", "Wardrobe", "Desk", "Cabinet", "Dining Set", "Home Decor"],
    filters: {
      Room: ["Living Room", "Bedroom", "Dining Room", "Office", "Kitchen", "Bathroom", "Outdoor"],
      Material: ["Wood", "Metal", "Plastic", "Glass", "Fabric", "Leather"],
      Condition: ["New", "Like New", "Good", "Fair", "Needs Repair"],
      Style: ["Modern", "Traditional", "Contemporary", "Vintage", "Industrial", "Scandinavian"],
    },
  },
  {
    name: "Jobs",
    subcategories: ["Full Time", "Part Time", "Freelance", "Internship", "Remote Work", "Contract", "Temporary"],
    filters: {
      "Job Type": ["Full Time", "Part Time", "Contract", "Freelance", "Internship", "Temporary"],
      "Experience Level": ["Entry Level", "Mid Level", "Senior Level", "Executive"],
      Industry: ["IT", "Healthcare", "Finance", "Education", "Retail", "Manufacturing", "Construction"],
      "Salary Range": ["Under $30k", "$30k-$50k", "$50k-$70k", "$70k-$100k", "$100k+"],
    },
  },
  {
    name: "Gaming",
    subcategories: ["Video Games", "Consoles", "PC Gaming", "Mobile Games", "Gaming Accessories", "Board Games"],
    filters: {
      Platform: ["PlayStation", "Xbox", "Nintendo", "PC", "Mobile", "VR"],
      Genre: ["Action", "Adventure", "RPG", "Sports", "Racing", "Strategy", "Puzzle"],
      Condition: ["New", "Used", "Digital"],
      "Age Rating": ["Everyone", "Teen", "Mature", "Adults Only"],
    },
  },
  {
    name: "Books",
    subcategories: ["Fiction", "Non-Fiction", "Educational", "Comics", "Magazines", "E-books", "Audiobooks"],
    filters: {
      Format: ["Hardcover", "Paperback", "E-book", "Audiobook"],
      Genre: ["Fiction", "Non-Fiction", "Biography", "History", "Science", "Self-Help", "Romance"],
      Condition: ["New", "Like New", "Good", "Fair", "Poor"],
      Language: ["English", "French", "Spanish", "Other"],
    },
  },
  {
    name: "Services",
    subcategories: [
      "Home Services",
      "Repair",
      "Cleaning",
      "Tutoring",
      "Photography",
      "Event Planning",
      "Transportation",
    ],
    filters: {
      "Service Type": ["Home Services", "Professional Services", "Personal Services", "Business Services"],
      Availability: ["Weekdays", "Weekends", "Evenings", "24/7"],
      Experience: ["Beginner", "Intermediate", "Expert", "Professional"],
      Location: ["At Your Location", "At My Location", "Online", "Flexible"],
    },
  },
  {
    name: "Other",
    subcategories: [
      "Sports Equipment",
      "Musical Instruments",
      "Art & Crafts",
      "Collectibles",
      "Tools",
      "Garden",
      "Baby Items",
    ],
    filters: {
      Category: ["Sports", "Music", "Art", "Tools", "Garden", "Baby", "Collectibles"],
      Condition: ["New", "Used", "Vintage", "Antique"],
      "Age Group": ["Baby", "Kids", "Teen", "Adult", "Senior"],
      "Indoor/Outdoor": ["Indoor", "Outdoor", "Both"],
    },
  },
]

// Helper functions for easy access
export const getCategoryByName = (name: string): CategoryData | undefined => {
  return UNIFIED_CATEGORIES.find((cat) => cat.name === name)
}

export const getSubcategoriesByCategory = (categoryName: string): string[] => {
  const category = getCategoryByName(categoryName)
  return category?.subcategories || []
}

export const getFiltersByCategory = (categoryName: string): Record<string, string[]> => {
  const category = getCategoryByName(categoryName)
  return category?.filters || {}
}

export const getAllCategoryNames = (): string[] => {
  return UNIFIED_CATEGORIES.map((cat) => cat.name)
}

// Create mapping for database queries
export const getCategoryMapping = (): Record<string, string[]> => {
  const mapping: Record<string, string[]> = {}
  UNIFIED_CATEGORIES.forEach((category) => {
    mapping[category.name] = category.subcategories
  })
  return mapping
}
