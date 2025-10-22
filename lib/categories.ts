// lib/categories.ts - COMPLETE FIXED VERSION
export interface CategoryData {
  name: string
  subcategories: string[]
  filters: Record<string, string[]>
}

export const CATEGORIES = [
  "Vehicles",
  "Electronics", 
  "Mobile",
  "Real Estate",
  "Fashion & Beauty",
  "Pets & Animals",
  "Furniture",
  "Services",
  "Sports", 
  "Books & Education",
  "Home Appliances",
  "Free Stuff"
] as const

export const SUBCATEGORY_MAPPINGS: { [key: string]: string[] } = {
  "Vehicles": [
    "Cars", "Trucks", "Classic Cars", "Auto Parts", "Trailers", 
    "Scooters", "Bicycles", "Motorcycles"
  ],
  "Electronics": [
    "Tablets", "Laptops", "Headphones", "Computers", "Cameras", "TV & Audio"
  ],
  "Mobile": [
    "Mobile Accessories", "Android Phones", "iPhones"
  ],
  "Real Estate": [
    "Roommates", "For Rent", "For Sale", "Land"
  ],
  "Fashion & Beauty": [
    "Shoes", "Accessories", "Women Clothing", "Men Clothing"
  ],
  "Pets & Animals": [
    "Cats", "Birds", "Other Pets", "Dogs", "Pet Supplies"
  ],
  "Furniture": [
    "Beds & Mattresses", "Book Shelves", "Chairs & Recliners", "Coffee Tables",
    "Sofa & Couches", "Dining Tables", "Wardrobes", "TV Tables"
  ],
  "Services": [
    "Nanny & Childcare", "Cleaners", "Financial & Legal", "Personal Trainer",
    "Food & Catering", "Health & Beauty", "Moving & Storage", "Music Lessons",
    "Photography & Video", "Skilled Trades", "Tutors & Languages", "Wedding"
  ],
  "Sports": [
    "Exercise Equipment", "Sportswear", "Outdoor Gear"
  ],
  "Books & Education": [
    "Fiction", "Textbooks", "Children Books", "Non-Fiction"
  ],
  "Home Appliances": [
    "Coffee Makers", "Cookers", "Dishwashers", "Heaters", "Irons", 
    "Microwaves", "Juicers & Blenders", "Refrigerators & Freezers", 
    "Gas Stoves", "Ovens", "Toasters", "Vacuums"
  ],
  "Free Stuff": [
    "Lost & Found", "Miscellaneous"
  ]
}

// For dropdowns and selects
export const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  ...CATEGORIES.map(category => ({
    value: category,
    label: category
  }))
]

// Helper functions for easy access
export const getCategoryByName = (name: string): CategoryData | undefined => {
  const subcategories = SUBCATEGORY_MAPPINGS[name] || []
  return {
    name,
    subcategories,
    filters: {} // You can add specific filters later if needed
  }
}

export const getSubcategoriesByCategory = (categoryName: string): string[] => {
  return SUBCATEGORY_MAPPINGS[categoryName] || []
}

export const getFiltersByCategory = (categoryName: string): Record<string, string[]> => {
  const category = getCategoryByName(categoryName)
  return category?.filters || {}
}

export const getAllCategoryNames = (): string[] => {
  return CATEGORIES
}

// Create mapping for database queries
export const getCategoryMapping = (): Record<string, string[]> => {
  return SUBCATEGORY_MAPPINGS
}

export function isValidCategory(category: string): boolean {
  return CATEGORIES.includes(category as any)
}
