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

// COMPLETE MAPPING: Human-readable names to database slugs
export const SUBCATEGORY_TO_SLUG: { [key: string]: string } = {
  // Real Estate
  "Roommates": "roommates",
  "For Rent": "for-rent", 
  "For Sale": "for-sale",
  "Land": "land",
  
  // Electronics
  "Cameras": "cameras",
  "Tablets": "tablets", 
  "Laptops": "laptops",
  "Headphones": "headphones",
  "Computers": "computers",
  "TV & Audio": "tv-audio",
  "Other Electronics": "other-electronics",
  
  // Vehicles
  "Cars": "cars",
  "Trucks": "trucks",
  "Classic Cars": "classic-cars",
  "Auto Parts": "auto-parts",
  "Trailers": "trailers",
  "Scooters": "scooters",
  "Bicycles": "bicycles",
  "Motorcycles": "motorcycles",
  
  // Mobile
  "Mobile Accessories": "mobile-accessories",
  "Android Phones": "android-phones",
  "iPhones": "iphones",
  
  // Fashion & Beauty
  "Shoes": "shoes",
  "Accessories": "accessories",
  "Women Clothing": "women-clothing",
  "Men Clothing": "men-clothing",
  
  // Pets & Animals
  "Cats": "cats",
  "Birds": "birds",
  "Other Pets": "other-pets",
  "Dogs": "dogs",
  "Pet Supplies": "pet-supplies",
  
  // Furniture
  "Beds & Mattresses": "beds-mattresses",
  "Book Shelves": "book-shelves",
  "Chairs & Recliners": "chairs-recliners",
  "Coffee Tables": "coffee-tables",
  "Sofa & Couches": "sofa-couches",
  "Dining Tables": "dining-tables",
  "Wardrobes": "wardrobes",
  "TV Tables": "tv-tables",
  
  // Services
  "Nanny & Childcare": "nanny-childcare",
  "Cleaners": "cleaners",
  "Financial & Legal": "financial-legal",
  "Personal Trainer": "personal-trainer",
  "Food & Catering": "food-catering",
  "Health & Beauty": "health-beauty",
  "Moving & Storage": "moving-storage",
  "Music Lessons": "music-lessons",
  "Photography & Video": "photography-video",
  "Skilled Trades": "skilled-trades",
  "Tutors & Languages": "tutors-languages",
  "Wedding": "wedding",
  
  // Sports
  "Exercise Equipment": "exercise-equipment",
  "Sportswear": "sportswear",
  "Outdoor Gear": "outdoor-gear",
  
  // Books & Education
  "Fiction": "fiction",
  "Textbooks": "textbooks",
  "Children Books": "children-books",
  "Non-Fiction": "non-fiction",
  
  // Home Appliances
  "Coffee Makers": "coffee-makers",
  "Cookers": "cookers",
  "Dishwashers": "dishwashers",
  "Heaters": "heaters",
  "Irons": "irons",
  "Microwaves": "microwaves",
  "Juicers & Blenders": "juicers-blenders",
  "Refrigerators & Freezers": "refrigerators-freezers",
  "Gas Stoves": "gas-stoves",
  "Ovens": "ovens",
  "Toasters": "toasters",
  "Vacuums": "vacuums",
  
  // Free Stuff
  "Lost & Found": "lost-found",
  "Miscellaneous": "miscellaneous"
}

export const SLUG_TO_SUBCATEGORY: { [key: string]: string } = Object.entries(SUBCATEGORY_TO_SLUG).reduce(
  (acc, [displayName, slug]) => {
    acc[slug] = displayName
    return acc
  },
  {} as { [key: string]: string },
)

// Helper functions
export const getCategoryByName = (name: string): CategoryData | undefined => {
  const subcategories = SUBCATEGORY_MAPPINGS[name] || []
  return {
    name,
    subcategories,
    filters: {}
  }
}

export const getSubcategoriesByCategory = (categoryName: string): string[] => {
  return SUBCATEGORY_MAPPINGS[categoryName] || []
}

export const getSubcategorySlug = (subcategory: string): string => {
  return SUBCATEGORY_TO_SLUG[subcategory] || 
    subcategory.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
}

export const getSubcategoryDisplayName = (slug: string): string => {
  const entry = Object.entries(SUBCATEGORY_TO_SLUG).find(
    ([displayName, dbSlug]) => dbSlug === slug
  )
  return entry ? entry[0] : formatDisplayName(slug)
}

const formatDisplayName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const isValidCategory = (category: string): boolean => {
  return CATEGORIES.includes(category as any)
}

export const isValidSubcategory = (category: string, subcategory: string): boolean => {
  const subcategories = SUBCATEGORY_MAPPINGS[category] || []
  const subcategorySlugs = subcategories.map(getSubcategorySlug)
  return subcategorySlugs.includes(subcategory)
}
