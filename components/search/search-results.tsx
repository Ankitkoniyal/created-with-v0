"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Eye, Grid3X3, List, Package, Loader2, Search } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { getOptimizedImageUrl } from "@/lib/images"

interface Product {
    id: string
    title: string
    price: number
    location: string
    city: string
    province: string
    images: string[]
    category_slug: string
    subcategory_slug: string
    condition: string
    status: string
    views?: number
    created_at: string
    user_id: string
    description: string
    category_name?: string
    subcategory_name?: string
}

interface SearchResultsProps {
    searchQuery: string
    filters: {
        category: string
        subcategory: string
        minPrice: string
        maxPrice: string
        condition: string
        location: string
        sortBy: string
        [key: string]: string
    }
    onLocationChange?: (location: string) => void
}

// Common search variations and corrections
const SEARCH_CORRECTIONS: { [key: string]: string } = {
    "job": "jobs",
    "jobs": "jobs-services",
    "work": "jobs-services",
    "employment": "jobs-services",
    "car": "vehicles",
    "cars": "vehicles",
    "vehicle": "vehicles",
    "bike": "bicycles",
    "bicycle": "bicycles",
    "phone": "mobile",
    "mobile": "mobile-phones",
    "house": "real-estate",
    "home": "real-estate",
    "property": "real-estate",
    "electronic": "electronics",
    "laptop": "electronics",
    "computer": "electronics",
    "fashion": "fashion-beauty",
    "clothes": "fashion-beauty",
    "clothing": "fashion-beauty",
    "beauty": "fashion-beauty",
    "garden": "home-garden",
    "pet": "pets-animals",
    "animal": "pets-animals",
    "game": "gaming",
    "book": "books-education",
    "education": "books-education",
    "service": "services",
    "sport": "sports"
}

// Category mapping for intelligent search
const CATEGORY_KEYWORDS: { [key: string]: string[] } = {
    "vehicles": ["car", "cars", "vehicle", "truck", "suv", "motorcycle", "auto", "automobile", "ford", "toyota", "honda"],
    "electronics": ["electronic", "laptop", "computer", "tv", "television", "camera", "headphone", "speaker", "phone", "tablet"],
    "mobile-phones": ["mobile", "phone", "smartphone", "iphone", "samsung", "android", "cellphone", "cellular"],
    "real-estate": ["house", "home", "property", "apartment", "condo", "rent", "lease", "realty", "estate"],
    "fashion-beauty": ["fashion", "clothes", "clothing", "beauty", "cosmetic", "makeup", "dress", "shirt", "shoes"],
    "home-garden": ["home", "garden", "furniture", "decor", "kitchen", "appliance", "tool", "furnishing"],
    "jobs-services": ["job", "jobs", "work", "employment", "career", "service", "hire", "recruitment", "vacancy"],
    "pets-animals": ["pet", "pets", "animal", "dog", "cat", "petcare", "veterinary", "breeder"],
    "gaming": ["game", "gaming", "playstation", "xbox", "nintendo", "console", "videogame", "pcgame"],
    "books-education": ["book", "books", "education", "textbook", "course", "learning", "study", "academic"],
    "services": ["service", "services", "professional", "consultant", "freelance", "contractor"],
    "sports": ["sport", "sports", "fitness", "exercise", "equipment", "outdoor", "recreation"]
}

export function SearchResults({ searchQuery, filters, onLocationChange }: SearchResultsProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null)
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
    
    const debouncedSearchQuery = useDebounce(searchQuery, 500)
    const debouncedFilters = useDebounce(filters, 500)

    // Intelligent search query processing
    const processSearchQuery = (query: string) => {
        if (!query.trim()) return { cleanQuery: "", suggestedCategory: null, suggestions: [] }
        
        const cleanQuery = query.trim().toLowerCase()
        let suggestedCategory = null
        const suggestions: string[] = []

        // Check for direct corrections
        if (SEARCH_CORRECTIONS[cleanQuery]) {
            suggestions.push(`Did you mean "${SEARCH_CORRECTIONS[cleanQuery]}"?`)
        }

        // Find category based on keywords
        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some(keyword => cleanQuery.includes(keyword))) {
                suggestedCategory = category
                suggestions.push(`Looking for ${category.replace('-', ' ')}?`)
                break
            }
        }

        // Check for very short queries and suggest expansions
        if (cleanQuery.length <= 3 && cleanQuery.length > 1) {
            const shortQuerySuggestions = {
                "job": "jobs, employment, work",
                "car": "cars, vehicles, automobiles", 
                "pet": "pets, animals, dogs, cats",
                "game": "games, gaming, consoles",
                "book": "books, textbooks, education"
            }
            
            if (shortQuerySuggestions[cleanQuery]) {
                suggestions.push(`Try: ${shortQuerySuggestions[cleanQuery]}`)
            }
        }

        return { cleanQuery, suggestedCategory, suggestions }
    }

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            setError(null)
            setSuggestedCategory(null)
            setSearchSuggestions([])

            try {
                const supabase = createClient()
                let query = supabase.from("products").select(`
                    *,
                    categories:category_slug(name),
                    subcategories:subcategory_slug(name)
                `)

                console.log("🔍 ENHANCED SEARCH:", {
                    originalQuery: debouncedSearchQuery,
                    filters: debouncedFilters
                })

                const { cleanQuery, suggestedCategory, suggestions } = processSearchQuery(debouncedSearchQuery)
                
                setSuggestedCategory(suggestedCategory)
                setSearchSuggestions(suggestions)

                // ENHANCED TEXT SEARCH - Works with short queries and typos
                if (cleanQuery) {
                    console.log("🎯 Processing search query:", cleanQuery)
                    
                    // Multi-column search with partial matching
                    query = query.or(`
                        title.ilike.%${cleanQuery}%,
                        description.ilike.%${cleanQuery}%,
                        category_slug.ilike.%${cleanQuery}%,
                        subcategory_slug.ilike.%${cleanQuery}%,
                        brand.ilike.%${cleanQuery}%,
                        tags.cs.{${cleanQuery}}
                    `)

                    // If query is very short, also search in individual words
                    if (cleanQuery.length <= 3) {
                        query = query.or(`
                            title.ilike.%${cleanQuery}%,
                            description.ilike.%${cleanQuery}%,
                            category_slug.ilike.%${cleanQuery}%
                        `)
                    }
                }

                // ✅ AUTO-CATEGORY SUGGESTION
                // If user searches for "job" but no category filter, suggest jobs-services
                if (suggestedCategory && !filters.category) {
                    console.log("🤖 Auto-suggesting category:", suggestedCategory)
                    // We'll show this as a suggestion to the user
                }

                // Apply filters (existing code)
                if (filters.category && filters.category !== "all") {
                    query = query.eq("category_slug", filters.category)
                }

                if (filters.subcategory && filters.subcategory !== "all") {
                    query = query.eq("subcategory_slug", filters.subcategory)
                }

                const minPrice = Number.parseInt(filters.minPrice) || 0
                const maxPrice = Number.parseInt(filters.maxPrice) || Number.MAX_SAFE_INTEGER

                if (minPrice > 0) {
                    query = query.gte("price", minPrice)
                }
                if (maxPrice < Number.MAX_SAFE_INTEGER) {
                    query = query.lte("price", maxPrice)
                }

                if (filters.condition && filters.condition !== "all") {
                    query = query.eq("condition", filters.condition.toLowerCase())
                }

                if (filters.location && filters.location.trim()) {
                    const raw = filters.location.trim()
                    if (raw.includes(",")) {
                        const [cityPart, provincePart] = raw.split(",").map((s) => s.trim())
                        if (cityPart && provincePart) {
                            query = query.ilike("city", `%${cityPart}%`).ilike("province", `%${provincePart}%`)
                        } else if (cityPart) {
                            query = query.ilike("city", `%${cityPart}%`)
                        }
                    } else {
                        const safe = raw.replace(/[()]/g, "")
                        query = query.or(`city.ilike.%${safe}%,province.ilike.%${safe}%`)
                    }
                }

                query = query.eq("status", "active")

                switch (filters.sortBy) {
                    case "newest":
                        query = query.order("created_at", { ascending: false })
                        break
                    case "price-low":
                        query = query.order("price", { ascending: true })
                        break
                    case "price-high":
                        query = query.order("price", { ascending: false })
                        break
                    default:
                        query = query.order("created_at", { ascending: false })
                }

                const { data, error: fetchError } = await query.limit(100)

                if (fetchError) {
                    console.error("Error fetching products:", fetchError)
                    setError("Failed to load products. Please try again.")
                } else {
                    console.log(`✅ Found ${data?.length || 0} products`)
                    setProducts(data || [])
                }
            } catch (err) {
                console.error("Search error:", err)
                setError("An error occurred while searching. Please try again.")
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [debouncedSearchQuery, debouncedFilters])

    // Add search suggestions UI
    const renderSearchSuggestions = () => {
        if (searchSuggestions.length === 0 || loading || products.length > 0) return null

        return (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                    <Search className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">Search Tips</h4>
                        <ul className="space-y-1 text-sm text-blue-800">
                            {searchSuggestions.map((suggestion, index) => (
                                <li key={index}>• {suggestion}</li>
                            ))}
                        </ul>
                        {suggestedCategory && (
                            <Button 
                                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => window.location.href = `/search?category=${suggestedCategory}`}
                            >
                                Browse {suggestedCategory.replace('-', ' ')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Rest of your component remains the same, but add renderSearchSuggestions() after loading check
    if (loading) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Searching...</h3>
                    <p className="text-muted-foreground">
                        {filters.location ? `Finding products in ${filters.location}` : "Finding products..."}
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Search Error</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()} className="bg-green-900 hover:bg-green-950">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Search Suggestions */}
            {renderSearchSuggestions()}

            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground">
                        {products.length} product{products.length !== 1 ? "s" : ""} found
                        {searchQuery && ` for "${searchQuery}"`}
                        {filters.location && ` in ${filters.location}`}
                        {filters.subcategory && filters.subcategory !== "all" && ` in ${filters.subcategory}`}
                        {!filters.subcategory && filters.category && filters.category !== "all" && ` in ${filters.category}`}
                    </p>
                    {filters.location && (
                        <p className="text-sm text-green-600 mt-1">
                            Showing results for location: <strong>{filters.location}</strong>
                        </p>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={
                            viewMode === "grid" ? "bg-green-900 hover:bg-green-950" : "hover:bg-green-100 hover:text-green-700"
                        }
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className={
                            viewMode === "list" ? "bg-green-900 hover:bg-green-950" : "hover:bg-green-100 hover:text-green-700"
                        }
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {products.map((product) => (
                    <Link key={product.id} href={`/product/${product.id}`} prefetch={false}>
                        <Card
                            className={`group cursor-pointer hover:shadow-lg hover:bg-green-50 hover:border-green-200 transition-all duration-300 ${
                                viewMode === "list" ? "flex" : ""
                            }`}
                        >
                            <CardContent className={`p-0 ${viewMode === "list" ? "flex" : ""}`}>
                                <div className={`relative ${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "h-48"}`}>
                                    <Image
                                        src={getOptimizedImageUrl(product.images?.[0], "thumb") || "/placeholder.svg"}
                                        alt={product.title}
                                        fill
                                        sizes={viewMode === "list" ? "192px" : "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 33vw"}
                                        className={`object-cover ${viewMode === "grid" ? "rounded-t-lg" : "rounded-l-lg"}`}
                                    />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="absolute top-2 right-2 bg-background/80 hover:bg-green-100 hover:text-green-700"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                        }}
                                    >
                                        <Heart className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                                    <h4 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-green-800">
                                        {product.title}
                                    </h4>
                                    <p className="text-2xl font-bold text-primary mb-2">${product.price.toLocaleString()}</p>

                                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                        <span className="capitalize">{product.condition}</span>
                                        <span>{product.category_slug || 'No category'}</span>
                                    </div>

                                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {product.city && product.province ? `${product.city}, ${product.province}` : product.location}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center">
                                            <Eye className="h-3 w-3 mr-1" />
                                            {product.views || 0} views
                                        </div>
                                        <span>{new Date(product.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
