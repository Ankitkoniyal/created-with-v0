// lib/category-utils.ts
import { CATEGORIES, SUBCATEGORY_TO_SLUG, SLUG_TO_SUBCATEGORY, CATEGORY_SLUG_TO_NAME } from "./categories"

export interface ResolvedCategory {
  displayName: string
  slug: string
}

export interface ResolvedSubcategory {
  displayName: string
  slug: string
}

const toSearchKey = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

const categorySlug = (category: string) => toSearchKey(category)

const CATEGORY_ALIASES: Record<string, string> = { ...CATEGORY_SLUG_TO_NAME }

const SUBCATEGORY_KEYS = Object.entries(SUBCATEGORY_TO_SLUG).map(([displayName, slug]) => ({
  displayName,
  slug,
  keys: [toSearchKey(displayName), toSearchKey(slug)],
}))

const CATEGORY_KEYS = CATEGORIES.map((category) => ({
  displayName: category,
  slug: categorySlug(category),
  key: toSearchKey(category),
}))

const levenshtein = (a: string, b: string) => {
  if (a === b) return 0
  if (!a) return b.length
  if (!b) return a.length

  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] =
          Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + 1)
      }
    }
  }

  return matrix[a.length][b.length]
}

const findBestMatch = <T extends { keys: string[] }>(
  inputKey: string,
  candidates: T[],
  keyAccessor: (candidate: T) => string[],
) => {
  let bestCandidate: T | undefined
  let bestScore = Number.POSITIVE_INFINITY

  for (const candidate of candidates) {
    const keys = keyAccessor(candidate)
    for (const key of keys) {
      if (!key) continue
      const distance = levenshtein(inputKey, key)
      if (distance < bestScore) {
        bestScore = distance
        bestCandidate = candidate
      }
      if (distance === 0) {
        return { candidate, score: 0 }
      }
    }
  }

  return { candidate: bestCandidate, score: bestScore }
}

const isAcceptableMatch = (input: string, candidate: string, distance: number) => {
  if (distance === 0) return true
  const maxLen = Math.max(input.length, candidate.length)
  if (maxLen <= 3) {
    return distance <= 1
  }
  if (maxLen <= 6) {
    return distance <= 2
  }
  return distance <= Math.ceil(maxLen * 0.35)
}

export const resolveCategoryInput = (input?: string | null): ResolvedCategory | undefined => {
  if (!input) return undefined
  const normalizedInput = toSearchKey(input)
  if (!normalizedInput) return undefined

  if (CATEGORY_ALIASES[normalizedInput]) {
    const displayName = CATEGORY_ALIASES[normalizedInput]
    return { displayName, slug: categorySlug(displayName) }
  }

  const directMatch = CATEGORY_KEYS.find(
    (candidate) => candidate.key === normalizedInput || candidate.slug === normalizedInput,
  )
  if (directMatch) {
    return { displayName: directMatch.displayName, slug: directMatch.slug }
  }

  const { candidate, score } = findBestMatch(
    normalizedInput,
    CATEGORY_KEYS.map((entry) => ({
      ...entry,
      keys: [entry.key, entry.slug],
    })),
    (entry) => entry.keys,
  )

  if (
    candidate &&
    isAcceptableMatch(normalizedInput, candidate.key, score ?? Number.POSITIVE_INFINITY)
  ) {
    return { displayName: candidate.displayName, slug: candidate.slug }
  }

  return undefined
}

export const resolveSubcategoryInput = (
  input?: string | null,
): ResolvedSubcategory | undefined => {
  if (!input) return undefined
  const trimmed = input.trim()
  if (!trimmed || trimmed.toLowerCase() === "all") return undefined

  const normalizedInput = toSearchKey(trimmed)

  if (SLUG_TO_SUBCATEGORY[normalizedInput]) {
    const displayName = SLUG_TO_SUBCATEGORY[normalizedInput]
    return { displayName, slug: SUBCATEGORY_TO_SLUG[displayName] }
  }

  const exactDisplay = SUBCATEGORY_KEYS.find(
    (entry) => toSearchKey(entry.displayName) === normalizedInput,
  )
  if (exactDisplay) {
    return { displayName: exactDisplay.displayName, slug: exactDisplay.slug }
  }

  const { candidate, score } = findBestMatch(
    normalizedInput,
    SUBCATEGORY_KEYS,
    (entry) => entry.keys,
  )

  if (
    candidate &&
    isAcceptableMatch(
      normalizedInput,
      candidate.keys.reduce((prev, key) => (key.length > prev.length ? key : prev), ""),
      score ?? Number.POSITIVE_INFINITY,
    )
  ) {
    return { displayName: candidate.displayName, slug: candidate.slug }
  }

  return undefined
}

export const toCategorySearchKey = toSearchKey
