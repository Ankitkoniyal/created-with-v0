// components/product-grid.tsx - FIXED WITH SELLER NAMES
"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { getOptimizedImageUrl } from "@/lib/images"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams, usePathname } from "next/navigation"
import { ErrorBoundary } from "@/components/error-boundary"
import { ProductCard } from "@/components/product-card-optimized"
import { useLanguage } from "@/hooks/use-language"
import React from "react"

interface Product {
  id: string
  title: string
  price: number
  price_type: string
  location: string
  city: string
  province: string
  condition: string
  category: string
  subcategory?: string
  brand?: string
  model?: string
  description: string
  images: string[]
  created_at: string
  user_id: string
  featured?: boolean
  seller?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

interface ProductGridProps {
  products?: Product[]
  searchQuery?: string
  filters?: {
    category?: string
    subcategory?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
    sortBy?: string
  }
  showPagination?: boolean // Add prop to control pagination visibility
}

const PRODUCTS_PER_PAGE = 20

export function ProductGrid({ products: overrideProducts, searchQuery, filters, showPagination = true }: ProductGridProps) {
  const { t, language } = useLanguage()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Get location: Priority 1) URL param, 2) localStorage
  const getLocationFilter = () => {
    if (typeof window === "undefined") return ""
    const urlLocation = searchParams.get("location") || ""
    if (urlLocation) return urlLocation
    try {
      return localStorage.getItem("user_selected_location") || ""
    } catch {
      return ""
    }
  }
  
  const locationFilter = getLocationFilter()
  const hasOverride = Array.isArray(overrideProducts)
  
  const shouldFetch = useMemo(() => typeof window !== 'undefined' && (
    pathname === "/" ||
    pathname?.startsWith("/search") ||
    pathname?.startsWith("/category") ||
    pathname?.startsWith("/seller") ||
    pathname?.startsWith("/product")
  ), [pathname])

  useEffect(() => {
    async function fetchProducts() {
      try {
        if (typeof window === 'undefined') {
          setLoading(false)
          return
        }

        const supabase = createClient()
        
        if (!supabase) {
          throw new Error('Supabase client not available.')
        }

        // FIXED: Include seller data in the query
        let query = supabase
          .from('products')
          .select(`
            *,
            seller:profiles!user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('status', 'active')

        // CRITICAL: Apply location filter FIRST to ensure it's always ANDed with other filters
        // Location filters MUST be applied before search query to ensure strict AND logic
        if (locationFilter) {
          const locationQuery = locationFilter.trim()
          if (locationQuery) {
            // Province abbreviation to full name mapping
            const provinceMap: Record<string, string> = {
              'ab': 'alberta', 'bc': 'british columbia', 'mb': 'manitoba', 'nb': 'new brunswick',
              'nl': 'newfoundland and labrador', 'nt': 'northwest territories', 'ns': 'nova scotia',
              'nu': 'nunavut', 'on': 'ontario', 'pe': 'prince edward island', 'qc': 'quebec',
              'sk': 'saskatchewan', 'yt': 'yukon',
            }
            
            // Normalize: remove accents, lowercase
            const normalized = locationQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            
            if (normalized.includes(",")) {
              // Format: "City, Province"
              let [cityPart, provincePart] = normalized.split(",").map(s => s.trim())
              
              // Convert province abbreviation to full name if needed
              if (provincePart && provincePart.length <= 2) {
                const fullName = provinceMap[provincePart]
                if (fullName) {
                  provincePart = fullName
                }
              }
              
              if (cityPart && provincePart) {
                // Build city variants for Saint/St handling
                const cityVariants = [cityPart]
                if (cityPart.startsWith("saint ")) {
                  cityVariants.push(cityPart.replace(/^saint /, "st "))
                  cityVariants.push(cityPart.replace(/^saint /, "st. "))
                } else if (cityPart.startsWith("st. ")) {
                  cityVariants.push(cityPart.replace(/^st\. /, "saint "))
                  cityVariants.push(cityPart.replace(/^st\. /, "st "))
                } else if (cityPart.startsWith("st ")) {
                  cityVariants.push(cityPart.replace(/^st /, "saint "))
                  cityVariants.push(cityPart.replace(/^st /, "st. "))
                }
                
                // ABSOLUTE FIX: Apply city and province filters separately - Supabase ANDs chained filters
                // This ensures: (search) AND (city matches ANY variant) AND (province matches ANY variant)
                if (cityVariants.length === 1) {
                  query = query.ilike("city", `%${cityVariants[0]}%`)
                } else {
                  const cityConditions = cityVariants.map(v => `city.ilike.%${v}%`).join(",")
                  query = query.or(cityConditions)
                }
                
                // Build province variants
                const provinceVariants = provincePart.length <= 2 && provinceMap[provincePart]
                  ? [provinceMap[provincePart], provincePart]
                  : [provincePart]
                
                if (provinceVariants.length === 1) {
                  query = query.ilike("province", `%${provinceVariants[0]}%`)
                } else {
                  const provinceConditions = provinceVariants.map(v => `province.ilike.%${v}%`).join(",")
                  query = query.or(provinceConditions)
                }
              } else if (cityPart) {
                // Only city provided
                query = query.ilike("city", `%${cityPart}%`)
                // Also try Saint/St variations
                if (cityPart.startsWith("saint ")) {
                  query = query.or(`city.ilike.%${cityPart.replace(/^saint /, "st ")}%,city.ilike.%${cityPart.replace(/^saint /, "st. ")}%`)
                } else if (cityPart.startsWith("st. ") || cityPart.startsWith("st ")) {
                  query = query.or(`city.ilike.%${cityPart.replace(/^st\.? /, "saint ")}%`)
                }
              }
            } else {
              // Single term - match city OR province
              // Check if it's a province abbreviation
              const fullProvinceName = provinceMap[normalized]
              if (fullProvinceName) {
                // It's a province abbreviation
                query = query.or(`province.ilike.%${fullProvinceName}%,province.ilike.%${normalized}%`)
              } else {
                // Could be city or province name
                query = query.or(`city.ilike.%${normalized}%,province.ilike.%${normalized}%`)
              }
              // Also try Saint/St variations for city
              if (normalized.startsWith("saint ")) {
                query = query.or(`city.ilike.%${normalized.replace(/^saint /, "st ")}%,city.ilike.%${normalized.replace(/^saint /, "st. ")}%`)
              } else if (normalized.startsWith("st. ") || normalized.startsWith("st ")) {
                query = query.or(`city.ilike.%${normalized.replace(/^st\.? /, "saint ")}%`)
              }
            }
          }
        }

        // CRITICAL: Apply search query filter AFTER location to ensure AND logic
        // This ensures: (location matches) AND (title OR description contains search term)
        if (searchQuery) {
          const cleanQuery = searchQuery.trim().toLowerCase().replace(/[%_]/g, "")
          if (cleanQuery) {
            const tokenFilters = [`title.ilike.%${cleanQuery}%`, `description.ilike.%${cleanQuery}%`]
            query = query.or(tokenFilters.join(","))
          }
        }

        // Apply category filter
        if (filters?.category && filters.category !== 'all' && filters.category !== '') {
          query = query.eq('category', filters.category)
        }

        // Apply subcategory filter
        if (filters?.subcategory && filters.subcategory !== 'all' && filters.subcategory !== '') {
          query = query.eq('subcategory', filters.subcategory)
        }

        // Apply condition filter
        if (filters?.condition && filters.condition !== 'all') {
          query = query.eq('condition', filters.condition)
        }

        // Apply price filters
        if (filters?.minPrice) {
          query = query.gte('price', parseInt(filters.minPrice))
        }
        if (filters?.maxPrice) {
          query = query.lte('price', parseInt(filters.maxPrice))
        }

        // Apply category-specific filters
        if (filters?.category) {
          const resolvedCategory = resolveCategoryInput(filters.category)
          if (resolvedCategory) {
            const categoryFilterConfig = getFiltersForCategory(resolvedCategory.slug)
            if (categoryFilterConfig) {
              Object.entries(categoryFilterConfig.filters).forEach(([key, filterConfig]) => {
                const fieldName = getFilterFieldName(key)
                const filterValue = (filters as any)[fieldName] as string | undefined

                if (filterValue) {
                  if (filterConfig.type === "select") {
                    query = query.eq(fieldName, filterValue)
                  } else if (filterConfig.type === "text") {
                    query = query.ilike(fieldName, `%${filterValue}%`)
                  } else if (filterConfig.type === "number") {
                    const numValue = parseInt(filterValue)
                    if (!isNaN(numValue)) {
                      query = query.eq(fieldName, numValue)
                    }
                  } else if (filterConfig.type === "range") {
                    const minKey = `${key}_min`
                    const maxKey = `${key}_max`
                    const minValue = (filters as any)[minKey] as string | undefined
                    const maxValue = (filters as any)[maxKey] as string | undefined

                    if (minValue) {
                      const min = parseInt(minValue)
                      if (!isNaN(min)) {
                        query = query.gte(fieldName, min)
                      }
                    }
                    if (maxValue) {
                      const max = parseInt(maxValue)
                      if (!isNaN(max)) {
                        query = query.lte(fieldName, max)
                      }
                    }
                  }
                }
              })
            }
          }
        }

        // Apply location filter - FIXED: properly handles province abbreviations
        if (locationFilter) {
          const locationQuery = locationFilter.trim()
          if (locationQuery) {
            // Province abbreviation to full name mapping
            const provinceMap: Record<string, string> = {
              'ab': 'alberta',
              'bc': 'british columbia',
              'mb': 'manitoba',
              'nb': 'new brunswick',
              'nl': 'newfoundland and labrador',
              'nt': 'northwest territories',
              'ns': 'nova scotia',
              'nu': 'nunavut',
              'on': 'ontario',
              'pe': 'prince edward island',
              'qc': 'quebec',
              'sk': 'saskatchewan',
              'yt': 'yukon',
            }
            
            // Normalize: remove accents, lowercase
            const normalized = locationQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            
            if (normalized.includes(",")) {
              // Format: "City, Province"
              let [cityPart, provincePart] = normalized.split(",").map(s => s.trim())
              
              // Convert province abbreviation to full name if needed
              if (provincePart && provincePart.length <= 2) {
                const fullName = provinceMap[provincePart]
                if (fullName) {
                  provincePart = fullName
                }
              }
              
              if (cityPart && provincePart) {
                // Build city variants for Saint/St handling
                const cityVariants = [cityPart]
                if (cityPart.startsWith("saint ")) {
                  cityVariants.push(cityPart.replace(/^saint /, "st "))
                  cityVariants.push(cityPart.replace(/^saint /, "st. "))
                } else if (cityPart.startsWith("st. ")) {
                  cityVariants.push(cityPart.replace(/^st\. /, "saint "))
                  cityVariants.push(cityPart.replace(/^st\. /, "st "))
                } else if (cityPart.startsWith("st ")) {
                  cityVariants.push(cityPart.replace(/^st /, "saint "))
                  cityVariants.push(cityPart.replace(/^st /, "st. "))
                }
                
                // Build province variants
                const provinceVariants = provincePart.length <= 2 && provinceMap[provincePart]
                  ? [provinceMap[provincePart], provincePart]
                  : [provincePart]
                
                // ABSOLUTE FIX: Apply city and province filters separately - Supabase ANDs chained filters
                // This ensures: (search) AND (city matches ANY variant) AND (province matches ANY variant)
                // Use .or() for variants within the same field - each .or() creates a separate OR group
                // Multiple OR groups are ANDed together by Supabase
                if (cityVariants.length === 1) {
                  query = query.ilike("city", `%${cityVariants[0]}%`)
                } else {
                  const cityConditions = cityVariants.map(v => `city.ilike.%${v}%`).join(",")
                  query = query.or(cityConditions)
                }
                
                if (provinceVariants.length === 1) {
                  query = query.ilike("province", `%${provinceVariants[0]}%`)
                } else {
                  const provinceConditions = provinceVariants.map(v => `province.ilike.%${v}%`).join(",")
                  query = query.or(provinceConditions)
                }
              } else if (cityPart) {
                // Only city provided
                query = query.ilike("city", `%${cityPart}%`)
                // Also try Saint/St variations
                if (cityPart.startsWith("saint ")) {
                  query = query.or(`city.ilike.%${cityPart.replace(/^saint /, "st ")}%,city.ilike.%${cityPart.replace(/^saint /, "st. ")}%`)
                } else if (cityPart.startsWith("st. ") || cityPart.startsWith("st ")) {
                  query = query.or(`city.ilike.%${cityPart.replace(/^st\.? /, "saint ")}%`)
                }
              }
            } else {
              // Single term - match city OR province
              // Check if it's a province abbreviation
              const fullProvinceName = provinceMap[normalized]
              if (fullProvinceName) {
                // It's a province abbreviation
                query = query.or(`province.ilike.%${fullProvinceName}%,province.ilike.%${normalized}%`)
              } else {
                // Could be city or province name
                query = query.or(`city.ilike.%${normalized}%,province.ilike.%${normalized}%`)
              }
              // Also try Saint/St variations for city
              if (normalized.startsWith("saint ")) {
                query = query.or(`city.ilike.%${normalized.replace(/^saint /, "st ")}%,city.ilike.%${normalized.replace(/^saint /, "st. ")}%`)
              } else if (normalized.startsWith("st. ") || normalized.startsWith("st ")) {
                query = query.or(`city.ilike.%${normalized.replace(/^st\.? /, "saint ")}%`)
              }
            }
          }
        }

        // Apply sorting
        if (filters?.sortBy) {
          switch (filters.sortBy) {
            case 'price-low':
              query = query.order('price', { ascending: true })
              break
            case 'price-high':
              query = query.order('price', { ascending: false })
              break
            case 'newest':
            default:
              query = query.order('created_at', { ascending: false })
              break
          }
        } else {
          query = query.order('created_at', { ascending: false })
        }

        // Initial page
        query = query.range(0, PRODUCTS_PER_PAGE - 1)

        const { data, error } = await query

        if (error) {
          throw error
        }

        setProducts(data || [])
        setHasMore((data || []).length === PRODUCTS_PER_PAGE)
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (!hasOverride && shouldFetch) {
      fetchProducts()
    } else if (hasOverride) {
      setProducts(overrideProducts as Product[])
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [hasOverride, overrideProducts, shouldFetch, locationFilter, searchQuery, filters?.category, filters?.subcategory, filters?.condition, filters?.minPrice, filters?.maxPrice, filters?.sortBy])

  const toggleFavorite = useCallback((productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(productId) ? next.delete(productId) : next.add(productId)
      return next
    })
  }, [])

  const formatPrice = useCallback((price?: number, priceType?: string) => {
    if (priceType === "free") return "Free"
    if (priceType === "contact") return "Contact"
    if (typeof price === "number") {
      return `$${price.toLocaleString()}`
    }
    return "Contact"
  }, [])

  const isNegotiable = useCallback((priceType?: string) => {
    return priceType === "negotiable" || priceType === "contact"
  }, [])

  const formatTimePosted = useCallback((createdAt?: string) => {
    if (!createdAt) return ""
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return language === "fr" ? "Maintenant" : "Now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 48) return "1j"
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}j`
    return posted.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { month: 'short', day: 'numeric' })
  }, [language])

  // Allow unregistered users to view seller ads
  const handleSellerClick = (e: React.MouseEvent, sellerId: string) => {
    e.preventDefault()
    e.stopPropagation()
    // Allow anyone to view seller ads without login
    window.location.href = `/seller/${sellerId}`
  }

  if (typeof window === 'undefined') {
    return (
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            <LoadingSkeleton type="card" count={10} />
          </div>
        </div>
      </section>
    )
  }

  if (!hasOverride && !shouldFetch) {
    return null
  }

  if (loading) {
    return (
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            <LoadingSkeleton type="card" count={10} />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Ads</h3>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-green-900 hover:bg-green-950 text-xs h-8">
              Try Again
            </Button>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery 
                ? (language === "fr" ? `Aucun résultat pour "${searchQuery}"` : `No results for "${searchQuery}"`)
                : t("products.noProducts")
              }
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {searchQuery 
                ? (language === "fr" ? "Essayez d'autres mots-clés ou supprimez certains filtres." : "Try different keywords or remove some filters.")
                : (language === "fr" ? "Soyez le premier à publier une annonce dans votre région !" : "Be the first to post an ad in your area!")
              }
            </p>
            <Button asChild className="bg-green-900 hover:bg-green-950 text-xs h-8">
              <Link href="/post">{language === "fr" ? "Publier votre première annonce" : "Post Your First Ad"}</Link>
            </Button>
            {searchQuery && (
              <Button 
                variant="outline" 
                className="ml-2 text-xs h-8"
                onClick={() => window.location.href = '/search'}
              >
                {language === "fr" ? "Effacer la recherche" : "Clear Search"}
              </Button>
            )}
          </div>
        </div>
      </section>
    )
  }

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const supabase = createClient()
      if (!supabase) return

      // Build the same query conditions as initial load
      let query = supabase
        .from('products')
        .select(`
          *,
          seller:profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'active')

      if (searchQuery) query = query.ilike('title', `%${searchQuery}%`)
      if (filters?.category && filters.category !== 'all' && filters.category !== '') query = query.eq('category', filters.category)
      if (filters?.subcategory && filters.subcategory !== 'all' && filters.subcategory !== '') query = query.eq('subcategory', filters.subcategory)
      if (filters?.condition && filters.condition !== 'all') query = query.eq('condition', filters.condition)
      if (filters?.minPrice) query = query.gte('price', parseInt(filters.minPrice))
      if (filters?.maxPrice) query = query.lte('price', parseInt(filters.maxPrice))

      // Location filter - FIXED: properly handles province abbreviations
      if (locationFilter) {
        const locationQuery = locationFilter.trim()
        if (locationQuery) {
          // Province abbreviation to full name mapping
          const provinceMap: Record<string, string> = {
            'ab': 'alberta',
            'bc': 'british columbia',
            'mb': 'manitoba',
            'nb': 'new brunswick',
            'nl': 'newfoundland and labrador',
            'nt': 'northwest territories',
            'ns': 'nova scotia',
            'nu': 'nunavut',
            'on': 'ontario',
            'pe': 'prince edward island',
            'qc': 'quebec',
            'sk': 'saskatchewan',
            'yt': 'yukon',
          }
          
          // Normalize: remove accents, lowercase
          const normalized = locationQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          
          if (normalized.includes(",")) {
            // Format: "City, Province"
            let [cityPart, provincePart] = normalized.split(",").map(s => s.trim())
            
            // Convert province abbreviation to full name if needed
            if (provincePart && provincePart.length <= 2) {
              const fullName = provinceMap[provincePart]
              if (fullName) {
                provincePart = fullName
              }
            }
            
            if (cityPart && provincePart) {
              // Build city variants for Saint/St handling
              const cityVariants = [cityPart]
              if (cityPart.startsWith("saint ")) {
                cityVariants.push(cityPart.replace(/^saint /, "st "))
                cityVariants.push(cityPart.replace(/^saint /, "st. "))
              } else if (cityPart.startsWith("st. ")) {
                cityVariants.push(cityPart.replace(/^st\. /, "saint "))
                cityVariants.push(cityPart.replace(/^st\. /, "st "))
              } else if (cityPart.startsWith("st ")) {
                cityVariants.push(cityPart.replace(/^st /, "saint "))
                cityVariants.push(cityPart.replace(/^st /, "st. "))
              }
              
              // ABSOLUTE FIX: In Supabase, multiple .or() calls create separate OR groups that are ANDed together
              // This ensures: (title matches) AND (city matches any variant) AND (province matches any variant)
              // Combine all city variants in single OR call
              const cityConditions = cityVariants.map(v => `city.ilike.%${v}%`).join(",")
              query = query.or(cityConditions)
              
              // Combine all province variants in single OR call (ANDed with city OR group)
              const provinceVariants = provincePart.length <= 2 && provinceMap[provincePart]
                ? [provinceMap[provincePart], provincePart]
                : [provincePart]
              const provinceConditions = provinceVariants.map(v => `province.ilike.%${v}%`).join(",")
              query = query.or(provinceConditions)
            } else if (cityPart) {
              // Only city provided
              query = query.ilike("city", `%${cityPart}%`)
              // Also try Saint/St variations
              if (cityPart.startsWith("saint ")) {
                query = query.or(`city.ilike.%${cityPart.replace(/^saint /, "st ")}%,city.ilike.%${cityPart.replace(/^saint /, "st. ")}%`)
              } else if (cityPart.startsWith("st. ") || cityPart.startsWith("st ")) {
                query = query.or(`city.ilike.%${cityPart.replace(/^st\.? /, "saint ")}%`)
              }
            }
          } else {
            // Single term - match city OR province
            // Check if it's a province abbreviation
            const fullProvinceName = provinceMap[normalized]
            if (fullProvinceName) {
              // It's a province abbreviation
              query = query.or(`province.ilike.%${fullProvinceName}%,province.ilike.%${normalized}%`)
            } else {
              // Could be city or province name
              query = query.or(`city.ilike.%${normalized}%,province.ilike.%${normalized}%`)
            }
            // Also try Saint/St variations for city
            if (normalized.startsWith("saint ")) {
              query = query.or(`city.ilike.%${normalized.replace(/^saint /, "st ")}%,city.ilike.%${normalized.replace(/^saint /, "st. ")}%`)
            } else if (normalized.startsWith("st. ") || normalized.startsWith("st ")) {
              query = query.or(`city.ilike.%${normalized.replace(/^st\.? /, "saint ")}%`)
            }
          }
        }
      }

      // Sorting
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'price-low':
            query = query.order('price', { ascending: true })
            break
          case 'price-high':
            query = query.order('price', { ascending: false })
            break
          case 'newest':
          default:
            query = query.order('created_at', { ascending: false })
            break
        }
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const from = products.length
      const to = from + PRODUCTS_PER_PAGE - 1
      const { data, error } = await query.range(from, to)
      if (error) throw error

      setProducts(prev => [...prev, ...(data || [])])
      setHasMore((data || []).length === PRODUCTS_PER_PAGE)
    } catch (e) {
      // swallow load more errors silently
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <section className="py-4 bg-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <ErrorBoundary>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-4 gap-y-6" key={language}>
                {products.map((product) => (
                  <ProductCard
                    key={`${product.id}-${language}`}
                    product={product}
                    isFavorite={favorites.has(product.id)}
                    onToggleFavorite={toggleFavorite}
                    formatPrice={formatPrice}
                    isNegotiable={isNegotiable}
                    formatTimePosted={formatTimePosted}
                  />
                ))}
              </div>
              {hasMore && showPagination && (
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={loadMore} 
                    disabled={isLoadingMore}
                    className="bg-green-900 hover:bg-green-950"
                  >
                    {isLoadingMore ? "Loading..." : "Show More"}
                  </Button>
                </div>
              )}
            </ErrorBoundary>
          </div>

          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                <Image 
                  src="https://gkaeeayfwrgekssmtuzn.supabase.co/storage/v1/object/public/product-images/fe09ea77-0be8-426e-9a88-9b4127f04a3c/side%20image.webp" 
                  alt="Canada's #1 Growing Marketplace" 
                  width={256} 
                  height={600} 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
