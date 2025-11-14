export interface CategoryData {
  name: string
  slug: string
  subcategories: string[]
  filters: Record<string, string[]>
}

interface SubcategoryConfig {
  name: string
  slug?: string
}

interface CategoryConfig {
  name: string
  slug: string
  subcategories: SubcategoryConfig[]
  aliases?: string[]
  nav?: boolean
}

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

export const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    name: "Home Appliances",
    slug: "home-appliances",
    aliases: ["appliance", "appliances"],
    subcategories: [
      { name: "Coffee Makers", slug: "coffee-makers" },
      { name: "Cookers", slug: "cookers" },
      { name: "Dishwashers", slug: "dishwashers" },
      { name: "Heaters", slug: "heaters" },
      { name: "Irons", slug: "irons" },
      { name: "Microwaves", slug: "microwaves" },
      { name: "Juicers & Blenders", slug: "juicers-blenders" },
      { name: "Refrigerators & Freezers", slug: "refrigerators-freezers" },
      { name: "Gas Stoves", slug: "gas-stoves" },
      { name: "Ovens", slug: "ovens" },
      { name: "Toasters", slug: "toasters" },
      { name: "Vacuums", slug: "vacuums" },
      { name: "Other Home Appliances", slug: "other-home-appliances" },
    ],
  },
  {
    name: "Electronics",
    slug: "electronics",
    aliases: ["electronic", "gadgets"],
    subcategories: [
      { name: "Laptops", slug: "laptops" },
      { name: "Tablets", slug: "tablets" },
      { name: "Cameras", slug: "cameras" },
      { name: "Headphones", slug: "headphones" },
      { name: "Computers", slug: "computers" },
      { name: "TV & Audio", slug: "tv-audio" },
      { name: "Other Electronics", slug: "other-electronics" },
    ],
  },
  {
    name: "Services",
    slug: "services",
    subcategories: [
      { name: "Nanny & Childcare", slug: "nanny-childcare" },
      { name: "Cleaners", slug: "cleaners" },
      { name: "Financial & Legal", slug: "financial-legal" },
      { name: "Personal Trainer", slug: "personal-trainer" },
      { name: "Food & Catering", slug: "food-catering" },
      { name: "Health & Beauty", slug: "health-beauty" },
      { name: "Moving & Storage", slug: "moving-storage" },
      { name: "Music Lessons", slug: "music-lessons" },
      { name: "Photography & Video", slug: "photography-video" },
      { name: "Skilled Trades", slug: "skilled-trades" },
      { name: "Tutors & Languages", slug: "tutors-languages" },
      { name: "Wedding", slug: "wedding" },
      { name: "Other Services", slug: "other-services" },
    ],
  },
  {
    name: "Vehicles",
    slug: "vehicles",
    aliases: ["vehicle", "autos", "car", "cars"],
    subcategories: [
      { name: "Cars", slug: "cars" },
      { name: "Trucks", slug: "trucks" },
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Scooters", slug: "scooters" },
      { name: "Bicycles", slug: "bicycles" },
      { name: "Classic Cars", slug: "classic-cars" },
      { name: "Trailers", slug: "trailers" },
      { name: "Auto Parts", slug: "auto-parts" },
      { name: "Other Vehicles", slug: "other-vehicles" },
    ],
  },
  {
    name: "Furniture",
    slug: "furniture",
    subcategories: [
      { name: "Beds & Mattresses", slug: "beds-mattresses" },
      { name: "Sofa & Couches", slug: "sofa-couches" },
      { name: "Dining Tables", slug: "dining-tables" },
      { name: "Chairs & Recliners", slug: "chairs-recliners" },
      { name: "Coffee Tables", slug: "coffee-tables" },
      { name: "TV Tables", slug: "tv-tables" },
      { name: "Wardrobes", slug: "wardrobes" },
      { name: "Book Shelves", slug: "book-shelves" },
      { name: "Other Furniture", slug: "other-furniture" },
    ],
  },
  {
    name: "Mobile",
    slug: "mobile",
    aliases: ["mobile-phones", "phones", "smartphones"],
    subcategories: [
      { name: "Android Phones", slug: "android-phones" },
      { name: "iPhones", slug: "iphones" },
      { name: "Mobile Accessories", slug: "mobile-accessories" },
      { name: "Other Mobile", slug: "other-mobile" },
    ],
  },
  {
    name: "Real Estate",
    slug: "real-estate",
    aliases: ["property", "properties", "realestate"],
    subcategories: [
      { name: "Roommates", slug: "roommates" },
      { name: "For Rent", slug: "for-rent" },
      { name: "For Sale", slug: "for-sale" },
      { name: "Land", slug: "land" },
      { name: "Other Real Estate", slug: "other-real-estate" },
    ],
  },
  {
    name: "Fashion & Beauty",
    slug: "fashion-beauty",
    aliases: ["fashion", "beauty"],
    subcategories: [
      { name: "Men Clothing", slug: "men-clothing" },
      { name: "Women Clothing", slug: "women-clothing" },
      { name: "Shoes", slug: "shoes" },
      { name: "Accessories", slug: "accessories" },
      { name: "Other Fashion & Beauty", slug: "other-fashion-beauty" },
    ],
  },
  {
    name: "Pets & Animals",
    slug: "pets-animals",
    aliases: ["pets", "animals"],
    subcategories: [
      { name: "Dogs", slug: "dogs" },
      { name: "Cats", slug: "cats" },
      { name: "Birds", slug: "birds" },
      { name: "Pet Supplies", slug: "pet-supplies" },
      { name: "Other Pets & Animals", slug: "other-pets-animals" },
    ],
  },
  {
    name: "Sports",
    slug: "sports",
    subcategories: [
      { name: "Exercise Equipment", slug: "exercise-equipment" },
      { name: "Sportswear", slug: "sportswear" },
      { name: "Outdoor Gear", slug: "outdoor-gear" },
      { name: "Other Sports", slug: "other-sports" },
    ],
  },
  {
    name: "Books & Education",
    slug: "books-education",
    aliases: ["books", "education"],
    subcategories: [
      { name: "Fiction Books", slug: "fiction-books" },
      { name: "Non-Fiction Books", slug: "non-fiction-books" },
      { name: "Textbooks", slug: "textbooks" },
      { name: "Children Books", slug: "children-books" },
      { name: "Other Books & Education", slug: "other-books-education" },
    ],
  },
  {
    name: "Free Stuff",
    slug: "free-stuff",
    aliases: ["free", "giveaways"],
    subcategories: [
      { name: "Lost & Found", slug: "lost-found" },
      { name: "Miscellaneous", slug: "miscellaneous" },
      { name: "Other Free Stuff", slug: "other-free-stuff" },
    ],
  },
]

export const CATEGORIES = CATEGORY_CONFIG.filter((config) => config.nav !== false).map((config) => config.name)

export const CATEGORY_NAME_TO_SLUG: Record<string, string> = CATEGORY_CONFIG.reduce((acc, config) => {
  acc[config.name] = config.slug
  return acc
}, {} as Record<string, string>)

export const CATEGORY_SLUG_TO_NAME: Record<string, string> = CATEGORY_CONFIG.reduce((acc, config) => {
  acc[config.slug] = config.name
  config.aliases?.forEach((alias) => {
    acc[toSlug(alias)] = config.name
  })
  return acc
}, {} as Record<string, string>)

export const SUBCATEGORY_MAPPINGS: Record<string, string[]> = CATEGORY_CONFIG.reduce(
  (acc, config) => {
    acc[config.name] = config.subcategories.map((subcategory) => subcategory.name)
    return acc
  },
  {} as Record<string, string[]>,
)

export const SUBCATEGORY_TO_SLUG: Record<string, string> = CATEGORY_CONFIG.reduce(
  (acc, config) => {
    config.subcategories.forEach((subcategory) => {
      if (!acc[subcategory.name]) {
        acc[subcategory.name] = subcategory.slug ?? toSlug(subcategory.name)
      }
    })
    return acc
  },
  {} as Record<string, string>,
)

export const SLUG_TO_SUBCATEGORY: Record<string, string> = Object.entries(SUBCATEGORY_TO_SLUG).reduce(
  (acc, [displayName, slug]) => {
    acc[slug] = displayName
    return acc
  },
  {} as Record<string, string>,
)

export const getCategorySlug = (category: string): string => {
  const normalized = toSlug(category)
  const displayName = CATEGORY_SLUG_TO_NAME[normalized]
  if (displayName) {
    return CATEGORY_NAME_TO_SLUG[displayName] ?? normalized
  }
  return normalized
}

export const getCategoryDisplayName = (slugOrName: string): string => {
  const normalized = toSlug(slugOrName)
  return CATEGORY_SLUG_TO_NAME[normalized] || slugOrName
}

export const getCategoryByName = (name: string): CategoryData | undefined => {
  const normalizedSlug = getCategorySlug(name)
  const displayName = CATEGORY_SLUG_TO_NAME[normalizedSlug]
  if (!displayName) return undefined

  const config = CATEGORY_CONFIG.find((item) => item.slug === normalizedSlug)
  if (!config) return undefined

  return {
    name: displayName,
    slug: config.slug,
    subcategories: config.subcategories.map((subcategory) => subcategory.name),
    filters: {},
  }
}

export const getSubcategoriesByCategory = (categoryName: string): string[] => {
  const normalizedSlug = getCategorySlug(categoryName)
  const displayName = CATEGORY_SLUG_TO_NAME[normalizedSlug]
  if (!displayName) return []
  return SUBCATEGORY_MAPPINGS[displayName] || []
}

export const getSubcategorySlug = (subcategory: string): string => {
  return SUBCATEGORY_TO_SLUG[subcategory] || toSlug(subcategory)
}

export const getSubcategoryDisplayName = (slug: string): string => {
  const normalized = slug.toLowerCase()
  return SLUG_TO_SUBCATEGORY[normalized] || formatDisplayName(normalized)
}

const formatDisplayName = (slug: string): string =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

export const isValidCategory = (category: string): boolean => {
  const normalized = getCategorySlug(category)
  return CATEGORY_CONFIG.some((config) => config.slug === normalized)
}

export const isValidSubcategory = (category: string, subcategory: string): boolean => {
  const normalizedCategory = CATEGORY_SLUG_TO_NAME[getCategorySlug(category)]
  if (!normalizedCategory) return false
  const subcategories = SUBCATEGORY_MAPPINGS[normalizedCategory] || []
  const subcategorySlugs = subcategories.map(getSubcategorySlug)
  const candidateSlug = getSubcategorySlug(subcategory)
  return subcategorySlugs.includes(candidateSlug)
}
