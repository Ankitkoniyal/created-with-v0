/**
 * Validates if a string is a valid UUID format
 * @param uuid - The string to validate
 * @returns boolean - True if valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Generates a simple numeric ID from a UUID for display purposes
 * This is a temporary solution until we implement proper slug IDs
 * @param uuid - The UUID to convert
 * @returns string - A shorter numeric representation
 */
export function uuidToDisplayId(uuid: string): string {
  // Simple hash function to convert UUID to a shorter number
  let hash = 0
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString().slice(0, 6)
}
