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

interface SearchResultsProps {
  searchQuery: string
  filters: any
  viewMode: "grid" | "list"
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
      
      try {
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

        if (searchQuery && searchQuery.trim() !== '') {
          const cleanQuery = searchQuery.trim().toLowerCase()
          query = query.or(`title.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`)
        }

        if (filters.category) {
          let categoryFilter = filters.category.toLowerCase()
          const categoryMap: {[key: string]: string} = {
            'home appliances': 'home-appliances',
            'real estate': 'real-estate',
            'fashion & beauty': 'fashion-beauty',
            'pets & animals': 'pets-animals',
            'books & education': 'books-education',
            'free stuff': 'free-stuff'
          }
          categoryFilter = categoryMap[categoryFilter] || categoryFilter
          query = query.eq('category', categoryFilter)
        }

        if (filters.subcategory && filters.subcategory !== 'all') {
          let subcategoryFilter = filters.subcategory.toLowerCase()
          const subcategoryMap: {[key: string]: string} = {
            'roommates': 'roommates',
            'for rent': 'for-rent',
            'for sale': 'for-sale',
            'land': 'land',
            'full time jobs': 'full-time-jobs',
            'part time jobs': 'part-time-jobs',
          }
          subcategoryFilter = subcategoryMap[subcategoryFilter] || subcategoryFilter
          query = query.eq('subcategory', subcategoryFilter)
        }

        if (filters.location && filters.location.trim() !== '') {
          const locationFilter = filters.location.trim().toLowerCase()
          query = query.or(`location.ilike.%${locationFilter}%,city.ilike.%${locationFilter}%,province.ilike.%${locationFilter}%`)
        }

        if (filters.minPrice) {
          query = query.gte('price', parseInt(filters.minPrice))
        }
        if (filters.maxPrice) {
          query = query.lte('price', parseInt(filters.maxPrice))
        }

        if (filters.condition && filters.condition !== 'all') {
          query = query.eq('condition', filters.condition)
        }

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

        const { data, error } = await query

        if (error) {
          console.error('Error fetching products:', error)
          setProducts([])
        } else {
          setProducts(data || [])
        }
      } catch (error) {
        console.error('Error in fetchProducts:', error)
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
        {filters.category && ` in ${filters.category}`}
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
