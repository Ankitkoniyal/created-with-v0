// components/category-navigation.tsx - WITH SCROLL FUNCTIONALITY
"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Grid, ChevronUp, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { CATEGORIES, SUBCATEGORY_MAPPINGS } from "@/lib/categories"

// UPDATED: Use centralized categories from lib/categories.ts
const ALL_CATEGORIES = CATEGORIES.map(category => ({
  name: category,
  slug: category.toLowerCase().replace(/\s+/g, '-'),
  subcategories: (SUBCATEGORY_MAPPINGS[category] || []).map(subcat => ({
    name: subcat,
    slug: subcat.toLowerCase().replace(/\s+/g, '-')
  }))
})).sort((a, b) => a.name.localeCompare(b.name))

// UPDATED: Quick menu items - Replaced Electronics with Real Estate
const QUICK_MENU_ITEMS = [
  { name: "Real Estate", slug: "real-estate" },
  { name: "Vehicles", slug: "vehicles" },
  { name: "Mobile", slug: "mobile" },

]

export function CategoryNavigation() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const categoriesListRef = useRef<HTMLDivElement>(null)
  const subcategoriesListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Check scroll position for categories
  const checkCategoriesScroll = () => {
    if (categoriesListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = categoriesListRef.current
      setCanScrollUp(scrollTop > 0)
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 5)
    }
  }

  // Scroll categories up
  const scrollCategoriesUp = () => {
    if (categoriesListRef.current) {
      categoriesListRef.current.scrollBy({ top: -100, behavior: 'smooth' })
    }
  }

  // Scroll categories down
  const scrollCategoriesDown = () => {
    if (categoriesListRef.current) {
      categoriesListRef.current.scrollBy({ top: 100, behavior: 'smooth' })
    }
  }

  const handleAllCategoriesClick = () => {
    setShowAllCategories(!showAllCategories)
    if (!showAllCategories) {
      setActiveCategory(null)
    }
  }

  const handleCategoryClick = (categorySlug: string) => {
    setActiveCategory(categorySlug)
    // Reset scroll position when changing categories
    if (subcategoriesListRef.current) {
      subcategoriesListRef.current.scrollTop = 0
    }
  }

  const handleQuickMenuItemClick = (item: typeof QUICK_MENU_ITEMS[0]) => {
    router.push(`/search?category=${item.name}`)
    setShowAllCategories(false)
  }

  const handleSubcategoryClick = (categoryName: string, subcategoryName: string) => {
    router.push(`/search?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
    setShowAllCategories(false)
    setActiveCategory(null)
  }

  const handleMainCategoryNavigate = (categoryName: string) => {
    router.push(`/search?category=${encodeURIComponent(categoryName)}`)
    setShowAllCategories(false)
    setActiveCategory(null)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAllCategories(false)
        setActiveCategory(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Check scroll on mount and when categories change
  useEffect(() => {
    if (showAllCategories) {
      setTimeout(checkCategoriesScroll, 100)
    }
  }, [showAllCategories, activeCategory])

  const activeCategoryData = ALL_CATEGORIES.find(cat => cat.slug === activeCategory)

  return (
    <div className="relative" ref={dropdownRef}>
      <nav className="flex items-center space-x-2 md:space-x-4 overflow-x-auto py-2 scrollbar-hide">
        <div className="relative flex-shrink-0">
          <button
            onClick={handleAllCategoriesClick}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
              showAllCategories
                ? "text-green-800 bg-green-50 border-green-300"
                : "text-gray-700 hover:text-green-800 hover:bg-green-50 border-transparent"
            }`}
          >
            <Grid className="h-4 w-4" />
            <span className="hidden sm:inline">All Categories</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${
                showAllCategories ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {QUICK_MENU_ITEMS.map((item) => (
          <button
            key={item.slug}
            onClick={() => handleQuickMenuItemClick(item)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm text-gray-700 hover:text-green-800 hover:bg-green-50 transition-all duration-200 flex-shrink-0 whitespace-nowrap"
          >
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      {showAllCategories && (
        <div
          className={`absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 ${
            isMobile
              ? "w-full max-w-[95vw] mx-auto left-1/2 transform -translate-x-1/2"
              : "w-[800px] min-h-[400px] max-h-[70vh]"
          }`}
        >
          <div className={`${isMobile ? 'flex-col' : 'flex'} ${isMobile ? 'max-h-[70vh]' : 'h-full'}`}>
            {/* Categories Sidebar with Scroll */}
            <div className={`${isMobile ? 'w-full' : 'w-2/5'} bg-gray-800 p-3 ${
              isMobile ? 'rounded-t-lg' : 'rounded-l-lg'
            } relative`}>
              <h3 className="font-semibold text-white text-sm mb-2 px-2">All Categories</h3>
              
              {/* Scroll Up Button */}
              {canScrollUp && !isMobile && (
                <button
                  onClick={scrollCategoriesUp}
                  className="absolute top-12 right-2 z-10 p-1 bg-gray-700 rounded text-white hover:bg-gray-600 transition-colors"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
              )}
              
              {/* Categories List with Scroll */}
              <div 
                ref={categoriesListRef}
                onScroll={checkCategoriesScroll}
                className="space-y-0.5 max-h-[calc(100%-2rem)] overflow-y-auto custom-scrollbar pr-2"
              >
                {ALL_CATEGORIES.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => handleCategoryClick(category.slug)}
                    className={`w-full text-left p-2 px-3 rounded text-sm transition-colors duration-150 flex items-center justify-between ${
                      activeCategory === category.slug
                        ? "bg-green-600 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    <span>{category.name}</span>
                    {category.subcategories.length > 0 && (
                      <ChevronRight className="h-3 w-3 opacity-70" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Scroll Down Button */}
              {canScrollDown && !isMobile && (
                <button
                  onClick={scrollCategoriesDown}
                  className="absolute bottom-2 right-2 z-10 p-1 bg-gray-700 rounded text-white hover:bg-gray-600 transition-colors"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Subcategories Panel */}
            {activeCategoryData && !isMobile ? (
              <div className="w-3/5 bg-gray-100 p-4 rounded-r-lg overflow-y-auto custom-scrollbar border-l border-gray-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">{activeCategoryData.name}</h3>
                  <button
                    onClick={() => handleMainCategoryNavigate(activeCategoryData.name)}
                    className="text-sm text-green-800 hover:text-green-900 font-medium bg-green-50 px-3 py-1 rounded-md transition-colors"
                  >
                    View all
                  </button>
                </div>
                <div 
                  ref={subcategoriesListRef}
                  className="space-y-2 max-h-[calc(100%-4rem)] overflow-y-auto custom-scrollbar pr-2"
                >
                  {activeCategoryData.subcategories.map((subcategory) => (
                    <button
                      key={subcategory.slug}
                      onClick={() => handleSubcategoryClick(activeCategoryData.name, subcategory.name)}
                      className="w-full text-left p-3 rounded-lg text-sm text-gray-700 hover:text-green-900 transition-colors duration-150 bg-white border border-gray-200 hover:border-green-800 hover:bg-green-50 hover:shadow-sm flex items-center"
                    >
                      <ChevronRight className="h-3 w-3 mr-2 text-green-600 flex-shrink-0" />
                      <span className="truncate">{subcategory.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              !isMobile && (
                <div className="w-3/5 bg-gray-100 p-8 rounded-r-lg flex items-center justify-center border-l border-gray-300">
                  <div className="text-center">
                    <Grid className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Click on a category to view subcategories</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
