// Utility functions for location formatting

// Map full province names to abbreviations
const PROVINCE_ABBREVIATIONS: Record<string, string> = {
  'Alberta': 'AB',
  'British Columbia': 'BC',
  'Manitoba': 'MB',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Northwest Territories': 'NT',
  'Nova Scotia': 'NS',
  'Nunavut': 'NU',
  'Ontario': 'ON',
  'Prince Edward Island': 'PE',
  'Quebec': 'QC',
  'Saskatchewan': 'SK',
  'Yukon': 'YT',
}

// Reverse map: abbreviations to full names (for display if needed)
const PROVINCE_FULL_NAMES: Record<string, string> = {
  'AB': 'Alberta',
  'BC': 'British Columbia',
  'MB': 'Manitoba',
  'NB': 'New Brunswick',
  'NL': 'Newfoundland and Labrador',
  'NT': 'Northwest Territories',
  'NS': 'Nova Scotia',
  'NU': 'Nunavut',
  'ON': 'Ontario',
  'PE': 'Prince Edward Island',
  'QC': 'Quebec',
  'SK': 'Saskatchewan',
  'YT': 'Yukon',
}

/**
 * Converts a province name to its abbreviation
 * @param province - Full province name or abbreviation
 * @returns Province abbreviation (e.g., "ON", "BC")
 */
export function getProvinceAbbreviation(province: string | null | undefined): string {
  if (!province) return ''
  
  const trimmed = province.trim()
  
  // If it's already an abbreviation (2 letters), return as-is
  if (trimmed.length <= 2) {
    return trimmed.toUpperCase()
  }
  
  // Try to find abbreviation from full name
  const abbreviation = PROVINCE_ABBREVIATIONS[trimmed]
  if (abbreviation) {
    return abbreviation
  }
  
  // Case-insensitive lookup
  const lowerTrimmed = trimmed.toLowerCase()
  for (const [fullName, abbrev] of Object.entries(PROVINCE_ABBREVIATIONS)) {
    if (fullName.toLowerCase() === lowerTrimmed) {
      return abbrev
    }
  }
  
  // If not found, return original (might be a custom value)
  return trimmed
}

/**
 * Formats location as "City, Province" with province abbreviation
 * @param city - City name
 * @param province - Province name (full or abbreviation)
 * @returns Formatted location string (e.g., "Surrey, BC")
 */
export function formatLocation(city: string | null | undefined, province: string | null | undefined): string {
  if (!city && !province) return ''
  if (!city) return getProvinceAbbreviation(province)
  if (!province) return city
  
  const abbrev = getProvinceAbbreviation(province)
  return `${city}, ${abbrev}`
}

/**
 * Parses a location string and returns formatted "City, Province" with abbreviation
 * Handles formats like:
 * - "Surrey, British Columbia" -> "Surrey, BC"
 * - "Surrey, BC" -> "Surrey, BC"
 * - "Surrey,BC" -> "Surrey, BC"
 * @param location - Full location string
 * @returns Formatted location with province abbreviation
 */
export function formatLocationString(location: string | null | undefined): string {
  if (!location) return ''
  
  const trimmed = location.trim()
  if (!trimmed) return ''
  
  // Check if it already contains a comma
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      const city = parts[0]
      const province = parts.slice(1).join(', ') // Handle multiple commas
      return formatLocation(city, province)
    }
  }
  
  // If no comma, return as-is (might be just city or just province)
  return trimmed
}

/**
 * Gets full province name from abbreviation
 * @param abbreviation - Province abbreviation (e.g., "ON", "BC")
 * @returns Full province name or original if not found
 */
export function getProvinceFullName(abbreviation: string | null | undefined): string {
  if (!abbreviation) return ''
  
  const trimmed = abbreviation.trim().toUpperCase()
  return PROVINCE_FULL_NAMES[trimmed] || trimmed
}

