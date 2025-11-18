// components/search/search-results.tsx - FIXED VERSION
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { getOptimizedImageUrl } from "@/lib/images"
import { normalizeCategory } from "@/lib/normalize-categories"
import { resolveCategoryInput, resolveSubcategoryInput } from "@/lib/category-utils"
import { useDebounce } from "@/hooks/use-debounce"
import { ErrorBoundary } from "@/components/error-boundary"
import { getFiltersForCategory, getFilterFieldName } from "@/lib/category-filters"

// Helper to safely access window in SSR
const getSearchParams = () => {
  if (typeof window === "undefined") return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}
const RECENT_SEARCHES_KEY = "coinmint_recent_searches"

interface SearchResultsProps {
  searchQuery: string
  filters: any
}

const tokenize = (value?: string) =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token, index, arr) => token && token.length > 1 && arr.indexOf(token) === index)

const sanitizeSearchTerm = (value: string) =>
  value
    .toLowerCase()
    .replace(/[%_]/g, "")
    .trim()

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
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1,
        )
      }
    }
  }

  return matrix[a.length][b.length]
}

const scoreProductMatch = (product: any, tokens: string[]) => {
  if (!tokens.length) return 0

  const sourceStrings: string[] = [
    product?.title,
    product?.description,
    Array.isArray(product?.tags) ? product.tags.join(" ") : product?.tags,
    product?.category,
    product?.subcategory,
  ]
    .flat()
    .filter(Boolean)
    .map((value) =>
      value
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    )

  if (!sourceStrings.length) return 0

  let aggregateScore = 0

  for (const token of tokens) {
    let bestDistance = Number.POSITIVE_INFINITY

    for (const source of sourceStrings) {
      const sourceTokens = source.split(/[^a-z0-9]+/).filter(Boolean)
      for (const candidate of sourceTokens) {
        const distance = levenshtein(token, candidate)
        if (distance < bestDistance) {
          bestDistance = distance
        }
        if (distance === 0) break
      }
      if (bestDistance === 0) break
    }

    if (bestDistance === Number.POSITIVE_INFINITY) {
      aggregateScore += 10
    } else {
      aggregateScore += bestDistance
    }
  }

  return aggregateScore
}

const sortProductsByRelevance = (products: any[], tokens: string[]) => {
  if (!tokens.length) return products

  return [...products].sort((a, b) => {
    const scoreA = scoreProductMatch(a, tokens)
    const scoreB = scoreProductMatch(b, tokens)
    return scoreA - scoreB
  })
}

const isGoodMatch = (product: any, tokens: string[]) => {
  if (!tokens.length) return true

  const text = [
    product?.title,
    product?.description,
    Array.isArray(product?.tags) ? product.tags.join(" ") : product?.tags,
    product?.category,
    product?.subcategory,
  ]
    .flat()
    .filter(Boolean)
    .map((value) =>
      value
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
    )
    .join(" ")

  return tokens.some((token) => {
    if (text.includes(token)) return true

    const words = text.split(/[^a-z0-9]+/).filter(Boolean)
    return words.some((word) => levenshtein(token, word) <= Math.ceil(Math.max(word.length, token.length) * 0.35))
  })
}

export function SearchResults({ searchQuery, filters }: SearchResultsProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const supabase = useMemo(() => createClient(), [])
  const cacheRef = useRef<Map<string, { data: any[]; timestamp: number }>>(new Map())
  const CACHE_TTL = 1000 * 60 // 1 minute cache
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get all URL params for category-specific filters
  const urlParams = useMemo(() => {
    const result: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      result[key] = value
    })
    return result
  }, [searchParams])

  const normalizedFilters = useMemo(
    () => ({
      category: filters?.category?.toString().trim() || "",
      subcategory: filters?.subcategory?.toString().trim() || "",
      location: filters?.location?.toString().trim() || "",
      minPrice: filters?.minPrice?.toString().trim() || "",
      maxPrice: filters?.maxPrice?.toString().trim() || "",
      condition: filters?.condition?.toString().trim() || "all",
      sortBy: filters?.sortBy?.toString().trim() || "newest",
      // Include all other URL params for category-specific filters
      ...urlParams,
    }),
    [
      filters?.category,
      filters?.subcategory,
      filters?.location,
      filters?.minPrice,
      filters?.maxPrice,
      filters?.condition,
      filters?.sortBy,
      urlParams,
    ],
  )

  const sanitizedSearch = useMemo(() => searchQuery?.trim() || "", [searchQuery])
  const debouncedSearch = useDebounce(sanitizedSearch, 300) // 300ms debounce delay
  const filtersSignature = useMemo(() => JSON.stringify(normalizedFilters), [normalizedFilters])
  const lastSavedSearchRef = useRef<string>("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const trimmed = sanitizedSearch.trim()
    if (!trimmed) return
    if (lastSavedSearchRef.current.toLowerCase() === trimmed.toLowerCase()) return

    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      const existing: string[] = stored ? JSON.parse(stored) : []
      const normalized = trimmed.toLowerCase()
      const filtered = existing.filter((item) => item.toLowerCase() !== normalized)
      const next = [trimmed, ...filtered].slice(0, 5)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      lastSavedSearchRef.current = trimmed
    } catch (error) {
      // Silently handle error
    }
  }, [sanitizedSearch])

  useEffect(() => {
    const parsedFilters = JSON.parse(filtersSignature) as typeof normalizedFilters
    const cacheKey = JSON.stringify({ search: debouncedSearch, filters: parsedFilters })
    const cached = cacheRef.current.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setError(null)
      setProducts(cached.data)
      setLoading(false)
      return
    }

    let isCancelled = false

    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      const searchTokens = tokenize(sanitizedSearch)

      try {
        const baseSelect = `
          id,
          title,
          description,
          price,
          price_type,
          condition,
          category,
          subcategory,
          tags,
          city,
          province,
          created_at,
          images
        `

        let query = supabase
          .from("products")
          .select(baseSelect)
          .eq("status", "active")

        if (sanitizedSearch) {
          const cleanQuery = sanitizeSearchTerm(sanitizedSearch)
          if (cleanQuery) {
            const tokenFilters = [`title.ilike.%${cleanQuery}%`, `description.ilike.%${cleanQuery}%`]
            query = query.or(tokenFilters.join(","))
          }
        }

        if (parsedFilters.category) {
          const resolvedCategory = resolveCategoryInput(parsedFilters.category)
          if (resolvedCategory) {
            const candidates = Array.from(
              new Set([
                resolvedCategory.slug,
                resolvedCategory.slug.toLowerCase(),
                resolvedCategory.displayName,
                resolvedCategory.displayName.toLowerCase(),
              ]),
            )
            query = query.in("category", candidates)
          } else {
            const categoryTerm = sanitizeSearchTerm(parsedFilters.category)
            if (categoryTerm) {
              query = query.ilike("category", `%${categoryTerm}%`)
            }
          }
        }

        if (parsedFilters.subcategory && parsedFilters.subcategory.toLowerCase() !== "all") {
          const resolvedSubcategory = resolveSubcategoryInput(parsedFilters.subcategory)
          if (resolvedSubcategory) {
            const candidates = Array.from(
              new Set([
                resolvedSubcategory.slug,
                resolvedSubcategory.slug.toLowerCase(),
                resolvedSubcategory.displayName,
                resolvedSubcategory.displayName.toLowerCase(),
              ]),
            )
            query = query.in("subcategory", candidates)
          } else {
            const subcategoryTerm = sanitizeSearchTerm(parsedFilters.subcategory)
            if (subcategoryTerm) {
              query = query.ilike("subcategory", `%${subcategoryTerm}%`)
            }
          }
        }

        if (parsedFilters.location) {
          const locationTerm = sanitizeSearchTerm(parsedFilters.location)
          if (locationTerm) {
            const locationFilter = `%${locationTerm}%`
            query = query.or(
              [
                `city.ilike.${locationFilter}`,
                `province.ilike.${locationFilter}`,
                `location.ilike.${locationFilter}`,
              ].join(","),
            )
          }
        }

        if (parsedFilters.minPrice) {
          const minPrice = parseInt(parsedFilters.minPrice)
          if (!Number.isNaN(minPrice)) {
            query = query.gte("price", minPrice)
          }
        }

        if (parsedFilters.maxPrice) {
          const maxPrice = parseInt(parsedFilters.maxPrice)
          if (!Number.isNaN(maxPrice)) {
            query = query.lte("price", maxPrice)
          }
        }

        if (parsedFilters.condition && parsedFilters.condition !== "all") {
          query = query.eq("condition", parsedFilters.condition)
        }

        // Apply category-specific filters (e.g., vehicle filters)
        const resolvedCategory = parsedFilters.category ? resolveCategoryInput(parsedFilters.category) : null
        if (resolvedCategory) {
          const categoryFilterConfig = getFiltersForCategory(resolvedCategory.slug)
          if (categoryFilterConfig) {
            Object.entries(categoryFilterConfig.filters).forEach(([filterKey, filterConfig]) => {
              const fieldName = getFilterFieldName(filterKey)
              const filterValue = parsedFilters[filterKey] || parsedFilters[fieldName]
              
              if (!filterValue) return

              if (filterConfig.type === "range") {
                // Handle range filters (min/max)
                const minValue = parsedFilters[`${filterKey}_min`] || parsedFilters[`${fieldName}_min`]
                const maxValue = parsedFilters[`${filterKey}_max`] || parsedFilters[`${fieldName}_max`]
                
                if (minValue) {
                  const min = parseInt(minValue)
                  if (!Number.isNaN(min)) {
                    query = query.gte(fieldName, min)
                  }
                }
                if (maxValue) {
                  const max = parseInt(maxValue)
                  if (!Number.isNaN(max)) {
                    query = query.lte(fieldName, max)
                  }
                }
              } else if (filterConfig.type === "select") {
                // Handle select filters (exact match)
                query = query.eq(fieldName, filterValue)
              } else if (filterConfig.type === "text") {
                // Handle text filters (partial match)
                query = query.ilike(fieldName, `%${filterValue}%`)
              } else if (filterConfig.type === "number") {
                // Handle number filters (exact match)
                const numValue = parseInt(filterValue)
                if (!Number.isNaN(numValue)) {
                  query = query.eq(fieldName, numValue)
                }
              }
            })
          }
        }

        switch (parsedFilters.sortBy) {
          case "price-low":
            query = query.order("price", { ascending: true })
            break
          case "price-high":
            query = query.order("price", { ascending: false })
            break
          case "newest":
          default:
            query = query.order("created_at", { ascending: false })
            break
        }

        query = query.limit(60)

        const { data, error } = await query

        if (isCancelled) return

        if (error) {
          setError(`Database error: ${error.message}`)
          setProducts([])
          return
        }

        let fetchedProducts = data || []

        if (fetchedProducts.length === 0 && searchTokens.length > 0) {
          const fallbackResponse = await supabase
            .from("products")
            .select(baseSelect)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(120)

          if (fallbackResponse.error) {
            if (!isCancelled) {
              setError(`Database error: ${fallbackResponse.error.message}`)
              setProducts([])
            }
            return
          }

          if (!isCancelled && fallbackResponse.data) {
            const fuzzyMatches = fallbackResponse.data.filter((product) => isGoodMatch(product, searchTokens))
            fetchedProducts = fuzzyMatches.length > 0 ? fuzzyMatches.slice(0, 60) : fallbackResponse.data
          }
        }

        const sortedProducts = sortProductsByRelevance(fetchedProducts, searchTokens)

        if (!isCancelled) {
          setProducts(sortedProducts)
          cacheRef.current.set(cacheKey, { data: sortedProducts, timestamp: Date.now() })
        }
      } catch (error: any) {
        if (!isCancelled) {
          setError(`Unexpected error: ${error.message}`)
          setProducts([])
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      isCancelled = true
    }
  }, [debouncedSearch, filtersSignature, retryToken, supabase])

  const toggleFavorite = (productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(productId) ? next.delete(productId) : next.add(productId)
      return next
    })
  }

  const formatPrice = (price: number, priceType?: string) => {
    if (priceType === "free") return "Free"
    if (priceType === "contact") return "Contact"
    if (price === 0 || price === null) return 'Free'
    if (price === -1) return 'Contact'
    if (price === -2) return 'Negotiable'
    return `$${price.toLocaleString()}`
  }

  const isNegotiable = (priceType?: string) => {
    return priceType === "negotiable" || priceType === "contact"
  }

  const formatTimePosted = (createdAt: string) => {
    if (!createdAt) return ""
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 48) return "1d"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`
    return posted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Error</h3>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <div className="flex justify-center gap-2">
            <Button 
              onClick={() => setRetryToken((token) => token + 1)}
              variant="outline"
              size="sm"
            >
              Retry Search
            </Button>
            <Button 
              onClick={() => router.push("/")}
              size="sm"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div>
        <div className="mb-4 text-sm text-muted-foreground">
          <span className="font-medium">{products.length}</span> product{products.length !== 1 ? 's' : ''} found
          {searchQuery && ` for "${searchQuery}"`}
          {filters.location && ` in ${filters.location}`}
          {filters.category && ` in ${normalizeCategory(filters.category)}`}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => {
          const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
          const optimizedPrimary = getOptimizedImageUrl(primaryImage, "thumb") || primaryImage

          return (
            <Link key={product.id} href={`/product/${product.id}`} className="block" prefetch={false}>
              <Card className="h-full flex flex-col overflow-hidden border border-gray-200 bg-white rounded-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                    <Image
                      src={optimizedPrimary || "/placeholder.svg"}
                      alt={product.title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                    
                    <button
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className={`absolute top-1 right-1 p-1 rounded ${
                        favorites.has(product.id) 
                          ? "text-red-500 bg-white/90" 
                          : "text-gray-400 bg-white/80"
                      }`}
                    >
                      <Heart 
                        className={`h-3.5 w-3.5 ${favorites.has(product.id) ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>

                  <div className="px-2 py-2 flex flex-col flex-1">
                    <div className="mb-1">
                      <span className="text-base font-bold text-green-700">
                        {formatPrice(product.price, product.price_type)}
                        {isNegotiable(product.price_type) && (
                          <span className="text-xs font-normal text-gray-600 ml-1">Negotiable</span>
                        )}
                      </span>
                    </div>
                      
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-tight">
                      {product.title}
                    </h4>

                    <div className="mt-auto flex items-end justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1 min-w-0 pr-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate"> 
                          {product.city}, {product.province}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0"> 
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>{formatTimePosted(product.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 text-sm mb-4">
              {searchQuery
                ? `No results for "${searchQuery}". Try adjusting your search keywords or filters.`
                : `No products match your current filters. Try broadening your criteria.`}
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  const params = new URLSearchParams()
                  if (searchQuery) params.set("q", searchQuery)
                  router.push(`/search?${params.toString()}`)
                  setRetryToken((token) => token + 1)
                }}
                variant="outline"
                size="sm"
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => {
                  router.push("/")
                  setRetryToken((token) => token + 1)
                }}
                size="sm"
              >
                Browse All
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  )
}