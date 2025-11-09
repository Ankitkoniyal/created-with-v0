// components/search/search-results.tsx - UPDATED WITH 4 COLUMNS AND NO SELLER TEXT
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getOptimizedImageUrl } from "@/lib/images"
import { normalizeCategory } from "@/lib/normalize-categories"
import { resolveCategoryInput, resolveSubcategoryInput } from "@/lib/category-utils"

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
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)

      const searchTokens = tokenize(searchQuery)

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
          images,
          primary_image
        `

        let query = supabase
          .from("products")
          .select(baseSelect)
          .eq("status", "active")

        if (searchTokens.length === 1) {
          const token = searchTokens[0]
          query = query.or(
            [
              `title.ilike.%${token}%`,
              `description.ilike.%${token}%`,
              `tags.ilike.%${token}%`,
            ].join(","),
          )
        } else if (searchTokens.length > 1) {
          for (const token of searchTokens) {
            query = query.or(
              [
                `title.ilike.%${token}%`,
                `description.ilike.%${token}%`,
                `tags.ilike.%${token}%`,
              ].join(","),
            )
          }
        } else if (searchQuery && searchQuery.trim() !== "") {
          const cleanQuery = searchQuery.trim().toLowerCase()
          query = query.or(
            [
              `title.ilike.%${cleanQuery}%`,
              `description.ilike.%${cleanQuery}%`,
              `tags.ilike.%${cleanQuery}%`,
            ].join(","),
          )
        }

        const resolvedCategory = resolveCategoryInput(filters.category)

        if (resolvedCategory) {
          const normalizedCategory = resolvedCategory.displayName
          if (normalizedCategory) {
            query = query.eq("category", normalizedCategory)
          }
        }

        const resolvedSubcategory = resolveSubcategoryInput(filters.subcategory)

        if (resolvedSubcategory) {
          const subcategoryCandidates = Array.from(
            new Set([
              resolvedSubcategory.displayName,
              resolvedSubcategory.slug,
              resolvedSubcategory.displayName.toLowerCase(),
              resolvedSubcategory.slug.toLowerCase(),
            ]),
          ).filter(Boolean)

          if (subcategoryCandidates.length > 0) {
            query = query.in("subcategory", subcategoryCandidates)
          }
        }

        if (filters.location && filters.location.trim() !== "") {
          const locationFilter = filters.location.trim().toLowerCase()
          query = query.or(
            [
              `location.ilike.%${locationFilter}%`,
              `city.ilike.%${locationFilter}%`,
              `province.ilike.%${locationFilter}%`,
            ].join(","),
          )
        }

        if (filters.minPrice) {
          query = query.gte("price", parseInt(filters.minPrice))
        }
        if (filters.maxPrice) {
          query = query.lte("price", parseInt(filters.maxPrice))
        }

        if (filters.condition && filters.condition !== "all") {
          query = query.eq("condition", filters.condition)
        }

        switch (filters.sortBy) {
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

        if (error) {
          console.error("Error fetching products:", error)
          setProducts([])
          return
        }

        let fetchedProducts = data || []

        if ((!fetchedProducts || fetchedProducts.length === 0) && searchTokens.length > 0) {
          const fallbackResponse = await supabase
            .from("products")
            .select(baseSelect)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(120)

          if (fallbackResponse.error) {
            console.error("Fallback product fetch failed:", fallbackResponse.error)
            setProducts([])
            return
          }

          const fuzzyMatches = (fallbackResponse.data || []).filter((product) =>
            isGoodMatch(product, searchTokens),
          )

          fetchedProducts = fuzzyMatches.length > 0 ? fuzzyMatches.slice(0, 60) : fallbackResponse.data || []
        }

        const sortedProducts = sortProductsByRelevance(fetchedProducts, searchTokens)
        setProducts(sortedProducts)
      } catch (error) {
        console.error("Error in fetchProducts:", error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [searchQuery, filters, supabase])

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
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        <span className="font-medium">{products.length}</span> product{products.length !== 1 ? 's' : ''} found
        {searchQuery && ` for "${searchQuery}"`}
        {filters.location && ` in ${filters.location}`}
        {filters.category && ` in ${normalizeCategory(filters.category)}`}
      </div>

      {/* UPDATED GRID: 2 columns on mobile, 4 columns on large screens */}
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
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite(product.id, e)
                      }}
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

                    {/* REMOVED: Seller name section */}

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
              {searchQuery ? `No results for "${searchQuery}". Try adjusting your search.` : 'Try adjusting your filters.'}
            </p>
            <Button 
              onClick={() => {
                const params = new URLSearchParams()
                if (searchQuery) params.set('q', searchQuery)
                router.push(`/search?${params.toString()}`)
              }}
              variant="outline"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
