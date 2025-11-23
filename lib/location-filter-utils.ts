// Location filtering utilities - handles English/French names and proper matching

/**
 * Normalizes location strings for comparison
 * Removes accents, converts to lowercase, handles French/English variations
 */
export function normalizeLocationString(location: string | null | undefined): string {
  if (!location) return ""
  
  return location
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim()
}

/**
 * French to English city name mappings
 */
const FRENCH_TO_ENGLISH_CITIES: Record<string, string> = {
  "montreal": "montreal",
  "montréal": "montreal",
  "quebec": "quebec",
  "québec": "quebec",
  "quebec city": "quebec",
  "ville de québec": "quebec",
  "trois-rivieres": "trois-rivieres",
  "trois-rivières": "trois-rivieres",
  "sherbrooke": "sherbrooke",
  "saguenay": "saguenay",
  "gatineau": "gatineau",
  "laval": "laval",
  "longueuil": "longueuil",
  "terrebonne": "terrebonne",
  "brossard": "brossard",
  "repmont": "repmont",
  "drummondville": "drummondville",
  "saint-jean-sur-richelieu": "saint-jean-sur-richelieu",
  "granby": "granby",
  "saint-jerome": "saint-jerome",
  "saint-jérôme": "saint-jerome",
}

/**
 * Province name variations (English/French/Abbreviation)
 */
const PROVINCE_VARIANTS: Record<string, string[]> = {
  "ontario": ["ontario", "on"],
  "quebec": ["quebec", "québec", "qc"],
  "british columbia": ["british columbia", "colombie-britannique", "bc", "cb"],
  "alberta": ["alberta", "ab"],
  "manitoba": ["manitoba", "mb"],
  "saskatchewan": ["saskatchewan", "sk"],
  "nova scotia": ["nova scotia", "nouvelle-écosse", "ns", "ne"],
  "new brunswick": ["new brunswick", "nouveau-brunswick", "nb"],
  "newfoundland and labrador": ["newfoundland and labrador", "terre-neuve-et-labrador", "nl", "tn"],
  "prince edward island": ["prince edward island", "île-du-prince-édouard", "pe", "ip"],
  "northwest territories": ["northwest territories", "territoires du nord-ouest", "nt", "tn"],
  "nunavut": ["nunavut", "nu"],
  "yukon": ["yukon", "yt"],
}

/**
 * Gets all possible province name variants for matching
 */
function getProvinceVariants(province: string): string[] {
  const normalized = normalizeLocationString(province)
  
  // Find matching province
  for (const [key, variants] of Object.entries(PROVINCE_VARIANTS)) {
    if (variants.includes(normalized)) {
      return variants
    }
  }
  
  // If not found, return normalized version
  return [normalized]
}

/**
 * Parses location string into city and province
 * Handles formats: "City, Province", "City,Province", "City Province", etc.
 */
export function parseLocation(location: string): { city: string | null; province: string | null } {
  if (!location) return { city: null, province: null }
  
  const normalized = location.trim()
  
  // Handle comma-separated: "Toronto, ON" or "Toronto, Ontario"
  if (normalized.includes(",")) {
    const parts = normalized.split(",").map(p => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      return {
        city: normalizeLocationString(parts[0]),
        province: normalizeLocationString(parts.slice(1).join(", ")), // Handle multiple commas
      }
    }
  }
  
  // Try to detect if it's just a province
  const provinceVariants = Object.keys(PROVINCE_VARIANTS)
  const normalizedLower = normalized.toLowerCase()
  
  for (const province of provinceVariants) {
    const variants = PROVINCE_VARIANTS[province]
    if (variants.some(v => normalizedLower.includes(v))) {
      return { city: null, province: normalizeLocationString(province) }
    }
  }
  
  // Assume it's a city if no province detected
  return { city: normalizeLocationString(normalized), province: null }
}

/**
 * Builds Supabase query filters for location
 * Returns query builder with proper location filters applied
 */
export function buildLocationFilter(
  query: any,
  locationFilter: string | null | undefined
): any {
  if (!locationFilter || !locationFilter.trim()) {
    return query
  }
  
  const parsed = parseLocation(locationFilter)
  const { city, province } = parsed
  
  // If we have both city and province, match both precisely
  if (city && province) {
    const provinceVariants = getProvinceVariants(province)
    
    // Match city (normalized, case-insensitive)
    // Match province with all its variants
    const provinceConditions = provinceVariants.map(v => `province.ilike.%${v}%`).join(",")
    
    return query
      .ilike("city", `%${city}%`)
      .or(provinceConditions)
  }
  
  // If only city, match city
  if (city) {
    // Also handle French city name variations
    const englishCity = FRENCH_TO_ENGLISH_CITIES[city] || city
    return query.or(`city.ilike.%${city}%,city.ilike.%${englishCity}%`)
  }
  
  // If only province, match province with all variants
  if (province) {
    const provinceVariants = getProvinceVariants(province)
    const conditions = provinceVariants.map(v => `province.ilike.%${v}%`).join(",")
    return query.or(conditions)
  }
  
  return query
}

/**
 * Checks if a product matches location filter
 * Used for client-side filtering when needed
 */
export function matchesLocation(
  product: { city?: string | null; province?: string | null; location?: string | null },
  locationFilter: string | null | undefined
): boolean {
  if (!locationFilter || !locationFilter.trim()) {
    return true // No filter means match all
  }
  
  const parsed = parseLocation(locationFilter)
  const { city: filterCity, province: filterProvince } = parsed
  
  // Normalize product location data
  const productCity = normalizeLocationString(product.city)
  const productProvince = normalizeLocationString(product.province)
  const productLocation = normalizeLocationString(product.location)
  
  // If we have both city and province filter, both must match
  if (filterCity && filterProvince) {
    const provinceVariants = getProvinceVariants(filterProvince)
    const cityMatches = productCity.includes(filterCity) || 
                       (FRENCH_TO_ENGLISH_CITIES[filterCity] && productCity.includes(FRENCH_TO_ENGLISH_CITIES[filterCity]))
    const provinceMatches = provinceVariants.some(v => 
      productProvince.includes(v) || productLocation.includes(v)
    )
    return cityMatches && provinceMatches
  }
  
  // If only city filter
  if (filterCity) {
    const englishCity = FRENCH_TO_ENGLISH_CITIES[filterCity] || filterCity
    return productCity.includes(filterCity) || 
           productCity.includes(englishCity) ||
           productLocation.includes(filterCity) ||
           productLocation.includes(englishCity)
  }
  
  // If only province filter
  if (filterProvince) {
    const provinceVariants = getProvinceVariants(filterProvince)
    return provinceVariants.some(v => 
      productProvince.includes(v) || 
      productLocation.includes(v)
    )
  }
  
  return true
}

