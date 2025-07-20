"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ImprovedAdCard } from "@/components/improved-ad-card"
import { CategorySidebar } from "@/components/category-sidebar"
import { SubcategorySection } from "@/components/subcategory-section"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllAds, mockCategories } from "@/lib/mock-data"
import { ArrowLeft, SlidersHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SubcategoryPage() {
  const params = useParams()
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("newest")
  const [filters, setFilters] = useState({})

  const category = useMemo(() => {
    return mockCategories.find((cat) => cat.slug === params.slug)
  }, [params.slug])

  const subcategory = useMemo(() => {
    if (!category?.subcategories) return null
    return category.subcategories.find((sub) => sub.slug === params.subcategory)
  }, [category, params.subcategory])

  const [ads, setAds] = useState<any[]>([])

  useEffect(() => {
    const allAds = getAllAds()
    setAds(allAds)
  }, [])

  const filteredAndSortedAds = useMemo(() => {
    let filtered = ads.filter((ad) => ad.status === "active")

    // Filter by category and subcategory
    if (category) {
      filtered = filtered.filter((ad) => ad.category_id === category.id)
    }
    if (subcategory) {
      filtered = filtered.filter((ad) => ad.subcategory_id === subcategory.id)
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "" && value !== "any") {
        switch (key) {
          case "priceMin":
            filtered = filtered.filter((ad) => ad.price && ad.price >= Number(value))
            break
          case "priceMax":
            filtered = filtered.filter((ad) => ad.price && ad.price <= Number(value))
            break
          case "condition":
            filtered = filtered.filter((ad) => ad.condition === value)
            break
          case "brand":
            filtered = filtered.filter((ad) => ad.brand && ad.brand.toLowerCase().includes(value.toLowerCase()))
            break
          case "location":
            filtered = filtered.filter(
              (ad) =>
                ad.city.toLowerCase().includes(value.toLowerCase()) ||
                ad.state.toLowerCase().includes(value.toLowerCase()) ||
                ad.location.toLowerCase().includes(value.toLowerCase()),
            )
            break
          case "negotiable":
            if (value === true) {
              filtered = filtered.filter((ad) => ad.negotiable)
            }
            break
        }
      }
    })

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price_low":
          return (a.price || 0) - (b.price || 0)
        case "price_high":
          return (b.price || 0) - (a.price || 0)
        case "title":
          return a.title.localeCompare(b.title)
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }, [ads, category, subcategory, filters, sortBy])

  const clearAllFilters = () => {
    setFilters({})
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Category not found</h1>
        </div>
      </div>
    )
  }

  if (!subcategory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Subcategory not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Subcategory Section */}
      <SubcategorySection category={category} selectedSubcategory={subcategory.slug} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4" />
            Back to {category.name}
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{subcategory.name}</h1>
          <p className="text-gray-600">
            {filteredAndSortedAds.length} {filteredAndSortedAds.length === 1 ? "item" : "items"} found in{" "}
            {category.name}
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full justify-center">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar - Desktop always visible, Mobile toggleable */}
          <div className={`w-80 flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
            <CategorySidebar
              category={category.id}
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearAllFilters}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Controls */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-600">Showing {filteredAndSortedAds.length} results</p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results */}
            {filteredAndSortedAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedAds.map((ad) => (
                  <ImprovedAdCard key={ad.id} ad={ad} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <p className="text-gray-500 text-lg mb-2">No items found in this subcategory.</p>
                  <p className="text-gray-400 mb-4">Try adjusting your filters or check back later.</p>
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
