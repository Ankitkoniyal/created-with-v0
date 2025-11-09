// lib/normalize-categories.ts
import { resolveCategoryInput, toCategorySearchKey } from "./category-utils"

export const normalizeCategory = (category: string): string => {
  if (!category) return ""

  const resolved = resolveCategoryInput(category)
  if (resolved) {
    return resolved.displayName
  }

  // Fallback to basic normalization to avoid breaking calls that expect non-empty string
  return category
}

export const normalizeCategoryToSlug = (category: string): string => {
  const resolved = resolveCategoryInput(category)
  if (resolved) {
    return resolved.slug
  }
  return toCategorySearchKey(category)
}
