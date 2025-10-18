// components/search/search-results.tsx
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface SearchResultsProps {
  searchQuery: string
  filters: any
  viewMode: "grid" | "list"
}

export function SearchResults({ searchQuery, filters, viewMode }: SearchResultsProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('status', 'active')

        // Apply search query - FIXED: Use ilike instead of textSearch
        if (searchQuery) {
          const cleanQuery = searchQuery.trim().toLowerCase()
          query = query.ilike('title', `%${cleanQuery}%`)
        }

        // Apply price filters
        if (filters.minPrice) {
          query = query.gte('price', parseInt(filters.minPrice))
        }
        if (filters.maxPrice) {
          query = query.lte('price', parseInt(filters.maxPrice))
        }

        // Apply condition filter
        if (filters.condition && filters.condition !== 'all') {
          query = query.eq('condition', filters.condition)
        }

        // Apply category filter
        if (filters.category) {
          query = query.eq('category', filters.category)
        }

        // Apply subcategory filter
        if (filters.subcategory && filters.subcategory !== 'all') {
          query = query.eq('subcategory', filters.subcategory)
        }

        // Apply sorting
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
          // Apply client-side filtering for search relevance
          let filteredProducts = data || []
          
          if (searchQuery) {
            const cleanQuery = searchQuery.trim().toLowerCase()
            
            // For "bike" search, exclude motorcycles
            if (cleanQuery === 'bike') {
              filteredProducts = filteredProducts.filter(product => {
                const title = product.title?.toLowerCase() || ''
                const excludedTerms = ['motorcycle', 'motor bike', 'scooter', 'motorbike']
                const hasExcludedTerm = excludedTerms.some(term => title.includes(term))
                return !hasExcludedTerm
              })
            }
          }
          
          setProducts(filteredProducts)
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

  // Format price display like homepage
  const formatPrice = (price: number) => {
    if (price === 0 || price === null) return 'Free'
    if (price === -1) return 'Contact'
    if (price === -2) return 'Negotiable'
    return `$${price}`
  }

  // Format date like homepage (e.g., "Sep 23")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Format location like homepage (e.g., "Richmond, Br...")
  const formatLocation = (location: string) => {
    if (!location) return ''
    if (location.length > 15) {
      return location.substring(0, 12) + '...'
    }
    return location
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
      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        <span className="font-medium">{products.length}</span> product{products.length !== 1 ? 's' : ''} found{searchQuery ? ` for "${searchQuery}"` : ''}
      </div>

      {/* Grid View - COMPACT like homepage */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.id}`}
              className="block group"
            >
              <Card className="overflow-hidden hover:shadow-md transition-all duration-200 group-hover:border-green-600 border border-gray-200 rounded-lg bg-white">
                {/* Product Image - Compact like homepage */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        // Hide broken image and show fallback
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback Image - Show if no image or image fails */}
                  {!product.image_url && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center text-gray-400">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-1">
                          <span className="text-lg">📷</span>
                        </div>
                        <p className="text-xs">No Image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Date Badge - Top right like homepage */}
                  <div className="absolute top-1 right-1">
                    <Badge className="bg-black/80 text-white text-xs font-normal px-1.5 py-0.5">
                      {formatDate(product.created_at)}
                    </Badge>
                  </div>
                </div>
                
                {/* Product Details - Compact like homepage */}
                <CardContent className="p-2">
                  {/* Price - Prominent at top */}
                  <div className="mb-1">
                    <p className="text-sm font-bold text-gray-900 leading-tight">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  
                  {/* Title - Single line truncated */}
                  <h3 className="font-medium text-gray-900 line-clamp-1 leading-tight text-xs mb-1 group-hover:text-green-700 transition-colors">
                    {product.title}
                  </h3>
                  
                  {/* Location - Compact */}
                  {product.location && (
                    <div className="flex items-center text-xs text-gray-600">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {formatLocation(product.location)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* List View - IMPROVED UI */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.id}`}
              className="block group"
            >
              <Card className="hover:shadow-sm transition-all duration-200 group-hover:border-green-600 border border-gray-200 rounded-lg bg-white">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {/* Product Image - Smaller */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden border">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : null}
                      
                      {!product.image_url && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="text-center text-gray-400 text-xs">
                            <span className="text-sm block">📷</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Details - Better layout */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        {/* Title - Left side */}
                        <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-green-700 transition-colors text-sm flex-1">
                          {product.title}
                        </h3>
                        
                        {/* Price - Right side */}
                        <div className="text-base font-bold text-gray-900 whitespace-nowrap ml-2">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                      
                      {/* Location and Date - Single row */}
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{product.location}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>{formatDate(product.created_at)}</span>
                        </div>
                      </div>
                      
                      {/* Description - Only if available */}
                      {product.description && (
                        <p className="text-xs text-gray-600 line-clamp-1 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

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
