// Category-specific filter configurations
// This defines what filters should appear for each category

export interface FilterOption {
  value: string
  label: string
}

export interface CategoryFilterConfig {
  category: string
  categorySlug: string
  filters: {
    [key: string]: {
      type: "select" | "number" | "range" | "text"
      label: string
      options?: FilterOption[]
      min?: number
      max?: number
      placeholder?: string
    }
  }
}

export const CATEGORY_FILTER_CONFIGS: CategoryFilterConfig[] = [
  {
    category: "Vehicles",
    categorySlug: "vehicles",
    filters: {
      brand: {
        type: "text",
        label: "Brand",
        placeholder: "e.g., Toyota, Honda, Ford",
      },
      model: {
        type: "text",
        label: "Model",
        placeholder: "e.g., Camry, Civic, F-150",
      },
      kilometer_driven: {
        type: "range",
        label: "Kilometer Driven",
        min: 0,
        max: 1000000,
      },
      fuel_type: {
        type: "select",
        label: "Fuel Type",
        options: [
          { value: "gasoline", label: "Gasoline" },
          { value: "diesel", label: "Diesel" },
          { value: "electric", label: "Electric" },
          { value: "hybrid", label: "Hybrid" },
          { value: "plug-in-hybrid", label: "Plug-in Hybrid" },
          { value: "cng", label: "CNG" },
          { value: "lpg", label: "LPG" },
          { value: "other", label: "Other" },
        ],
      },
      seating_capacity: {
        type: "select",
        label: "Seating Capacity",
        options: [
          { value: "2", label: "2 Seater" },
          { value: "4", label: "4 Seater" },
          { value: "5", label: "5 Seater" },
          { value: "6", label: "6 Seater" },
          { value: "7", label: "7 Seater" },
          { value: "8", label: "8 Seater" },
          { value: "9", label: "9+ Seater" },
        ],
      },
      transmission: {
        type: "select",
        label: "Transmission",
        options: [
          { value: "automatic", label: "Automatic" },
          { value: "manual", label: "Manual" },
          { value: "cvt", label: "CVT" },
          { value: "amt", label: "AMT" },
        ],
      },
      car_type: {
        type: "select",
        label: "Car Type",
        options: [
          { value: "sedan", label: "Sedan" },
          { value: "suv", label: "SUV" },
          { value: "hatchback", label: "Hatchback" },
          { value: "coupe", label: "Coupe" },
          { value: "convertible", label: "Convertible" },
          { value: "wagon", label: "Wagon" },
          { value: "truck", label: "Truck" },
          { value: "van", label: "Van" },
          { value: "pickup", label: "Pickup" },
          { value: "motorcycle", label: "Motorcycle" },
          { value: "scooter", label: "Scooter" },
          { value: "bicycle", label: "Bicycle" },
          { value: "other", label: "Other" },
        ],
      },
      posted_by: {
        type: "select",
        label: "Posted By",
        options: [
          { value: "owner", label: "Owner" },
          { value: "dealer", label: "Dealer" },
        ],
      },
      year: {
        type: "range",
        label: "Year",
        min: 1950,
        max: new Date().getFullYear() + 1,
      },
    },
  },
  {
    category: "Real Estate",
    categorySlug: "real-estate",
    filters: {
      property_type: {
        type: "select",
        label: "Property Type",
        options: [
          { value: "house", label: "House" },
          { value: "apartment", label: "Apartment" },
          { value: "condo", label: "Condo" },
          { value: "townhouse", label: "Townhouse" },
          { value: "duplex", label: "Duplex" },
          { value: "studio", label: "Studio" },
          { value: "land", label: "Land" },
          { value: "commercial", label: "Commercial" },
          { value: "other", label: "Other" },
        ],
      },
      bedrooms: {
        type: "number",
        label: "Bedrooms",
        min: 0,
        max: 10,
      },
      bathrooms: {
        type: "number",
        label: "Bathrooms",
        min: 0,
        max: 10,
      },
      square_feet: {
        type: "range",
        label: "Square Feet",
        min: 0,
        max: 50000,
      },
      lot_size: {
        type: "range",
        label: "Lot Size (sq ft)",
        min: 0,
        max: 1000000,
      },
    },
  },
  {
    category: "Electronics",
    categorySlug: "electronics",
    filters: {
      brand: {
        type: "text",
        label: "Brand",
        placeholder: "e.g., Apple, Samsung, Sony",
      },
      model: {
        type: "text",
        label: "Model",
        placeholder: "e.g., iPhone 14, Galaxy S23",
      },
      storage: {
        type: "select",
        label: "Storage",
        options: [
          { value: "16gb", label: "16 GB" },
          { value: "32gb", label: "32 GB" },
          { value: "64gb", label: "64 GB" },
          { value: "128gb", label: "128 GB" },
          { value: "256gb", label: "256 GB" },
          { value: "512gb", label: "512 GB" },
          { value: "1tb", label: "1 TB" },
          { value: "2tb", label: "2 TB+" },
        ],
      },
      color: {
        type: "text",
        label: "Color",
        placeholder: "e.g., Black, White, Silver",
      },
    },
  },
  {
    category: "Furniture",
    categorySlug: "furniture",
    filters: {
      material: {
        type: "select",
        label: "Material",
        options: [
          { value: "wood", label: "Wood" },
          { value: "metal", label: "Metal" },
          { value: "fabric", label: "Fabric" },
          { value: "leather", label: "Leather" },
          { value: "glass", label: "Glass" },
          { value: "plastic", label: "Plastic" },
          { value: "mixed", label: "Mixed" },
          { value: "other", label: "Other" },
        ],
      },
      color: {
        type: "text",
        label: "Color",
        placeholder: "e.g., Brown, Black, White",
      },
    },
  },
  {
    category: "Fashion & Beauty",
    categorySlug: "fashion-beauty",
    filters: {
      brand: {
        type: "text",
        label: "Brand",
        placeholder: "e.g., Nike, Adidas, Zara",
      },
      size: {
        type: "select",
        label: "Size",
        options: [
          { value: "xs", label: "XS" },
          { value: "s", label: "S" },
          { value: "m", label: "M" },
          { value: "l", label: "L" },
          { value: "xl", label: "XL" },
          { value: "xxl", label: "XXL" },
          { value: "one-size", label: "One Size" },
        ],
      },
      color: {
        type: "text",
        label: "Color",
        placeholder: "e.g., Red, Blue, Black",
      },
    },
  },
]

export function getFiltersForCategory(categorySlug: string): CategoryFilterConfig | null {
  const normalized = categorySlug.toLowerCase().trim()
  return CATEGORY_FILTER_CONFIGS.find(
    (config) => config.categorySlug === normalized
  ) || null
}

export function getFilterFieldName(filterKey: string): string {
  // Map filter keys to database column names
  const fieldMap: Record<string, string> = {
    brand: "brand",
    model: "model",
    year: "year",
    mileage: "mileage",
    kilometer_driven: "kilometer_driven",
    fuel_type: "fuel_type",
    transmission: "transmission",
    body_type: "body_type",
    car_type: "car_type",
    seating_capacity: "seating_capacity",
    posted_by: "posted_by",
    property_type: "property_type",
    bedrooms: "bedrooms",
    bathrooms: "bathrooms",
    square_feet: "square_feet",
    lot_size: "lot_size",
    storage: "storage",
    color: "color",
    material: "material",
    size: "size",
  }
  return fieldMap[filterKey] || filterKey
}


