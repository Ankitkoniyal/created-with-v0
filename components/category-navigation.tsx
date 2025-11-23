// components/category-navigation.tsx - COMPLETE FIXED VERSION
"use client"

import { useState, useRef, useEffect } from "react"
import {
  ChevronDown,
  Grid,
  ChevronUp,
  ChevronRight,
  X,
  ArrowRight,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2,
  Clock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/hooks/use-language"
import { CATEGORIES, SUBCATEGORY_MAPPINGS, getSubcategorySlug, getCategorySlug } from "@/lib/categories"
import { translateCategory, translateSubcategory } from "@/lib/category-translations"

// FIXED: Use proper slug mapping
const ALL_CATEGORIES = CATEGORIES.map((category) => ({
  name: category,
  slug: getCategorySlug(category),
  subcategories: (SUBCATEGORY_MAPPINGS[category] || []).map((subcat) => ({
    name: subcat,
    slug: getSubcategorySlug(subcat),
  })),
})).sort((a, b) => a.name.localeCompare(b.name))

// Quick menu items - will be translated dynamically
const QUICK_MENU_ITEMS = [
  { name: "Real Estate", slug: "real-estate", nameKey: "Real Estate" },
  { name: "Vehicles", slug: "vehicles", nameKey: "Vehicles" },
  { name: "Mobile", slug: "mobile", nameKey: "Mobile" },
]

const TRENDING_SEARCHES = [
  { label: "iPhones", query: "iphones" },
  { label: "Rooms for Rent", query: "room for rent" },
  { label: "Motorcycles", query: "motorcycles" },
]

const RECENT_SEARCHES_KEY = "coinmint_recent_searches"

const saveSearchToHistory = (query: string, setState?: (values: string[]) => void) => {
  if (typeof window === "undefined") return
  const trimmed = query.trim()
  if (!trimmed) return

  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    const existing: string[] = stored ? JSON.parse(stored) : []
    const normalized = trimmed.toLowerCase()
    const filtered = existing.filter((item) => item.toLowerCase() !== normalized)
    const next = [trimmed, ...filtered].slice(0, 3)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
    if (setState) {
      setState(next.slice(0, 3))
    }
  } catch (error) {
    console.warn("Failed to save search history", error)
  }
}

export function CategoryNavigation() {
  const { t, language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [mobileCanScrollUp, setMobileCanScrollUp] = useState(false)
  const [mobileCanScrollDown, setMobileCanScrollDown] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const categoriesListRef = useRef<HTMLDivElement>(null)
  const subcategoriesListRef = useRef<HTMLDivElement>(null)
  const mobileCategoriesRef = useRef<HTMLDivElement>(null)
  const mobileSheetRef = useRef<HTMLDivElement>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

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

  const checkMobileCategoriesScroll = () => {
    if (mobileCategoriesRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = mobileCategoriesRef.current
      setMobileCanScrollUp(scrollTop > 0)
      setMobileCanScrollDown(scrollTop < scrollHeight - clientHeight - 5)
    }
  }

  // Scroll categories up
  const scrollCategoriesUp = () => {
    if (categoriesListRef.current) {
      categoriesListRef.current.scrollBy({ top: -140, behavior: "smooth" })
      setTimeout(checkCategoriesScroll, 200)
    }
  }

  // Scroll categories down
  const scrollCategoriesDown = () => {
    if (categoriesListRef.current) {
      categoriesListRef.current.scrollBy({ top: 140, behavior: "smooth" })
      setTimeout(checkCategoriesScroll, 200)
    }
  }

  const scrollMobileCategories = (offset: number) => {
    if (mobileCategoriesRef.current) {
      mobileCategoriesRef.current.scrollBy({ top: offset, behavior: "smooth" })
      setTimeout(checkMobileCategoriesScroll, 200)
    }
  }

  const handleAllCategoriesClick = () => {
    setShowAllCategories((prev) => !prev)
    if (!showAllCategories) {
      setActiveCategory(null)
      setTimeout(checkCategoriesScroll, 50)
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
    saveSearchToHistory(item.name, setRecentSearches)
    router.push(`/search?category=${item.name}`)
    setShowAllCategories(false)
    setTimeout(() => {
      checkCategoriesScroll()
      checkMobileCategoriesScroll()
    }, 150)
  }

  // FIXED: Use proper slug mapping for subcategories
  const handleSubcategoryClick = (categoryName: string, subcategoryName: string) => {
    const subcategorySlug = getSubcategorySlug(subcategoryName)
    saveSearchToHistory(`${categoryName} ${subcategoryName}`, setRecentSearches)
    router.push(`/search?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategorySlug)}`)
    setShowAllCategories(false)
    setActiveCategory(null)
    setTimeout(() => {
      checkCategoriesScroll()
      checkMobileCategoriesScroll()
    }, 150)
  }

  const handleMainCategoryNavigate = (categoryName: string) => {
    saveSearchToHistory(categoryName, setRecentSearches)
    router.push(`/search?category=${encodeURIComponent(categoryName)}`)
    setShowAllCategories(false)
    setActiveCategory(null)
    setTimeout(() => {
      checkCategoriesScroll()
      checkMobileCategoriesScroll()
    }, 150)
  }

  const handleTrendingClick = (query: string) => {
    saveSearchToHistory(query, setRecentSearches)
    router.push(`/search?q=${encodeURIComponent(query)}`)
    setShowAllCategories(false)
    setActiveCategory(null)
  }

  const handleRecentClick = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`)
    setShowAllCategories(false)
    setActiveCategory(null)
  }

  const loadRecentSearches = () => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (!stored) {
        setRecentSearches([])
        return
      }
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.slice(0, 3))
      } else {
        setRecentSearches([])
      }
    } catch {
      setRecentSearches([])
    }
  }

  const handleRemoveRecent = (query: string) => {
    if (typeof window === "undefined") return
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== query)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered))
      } catch (error) {
        console.warn("Failed to update recent searches", error)
      }
      return filtered
    })
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
      const timeout = setTimeout(() => {
        checkCategoriesScroll()
        checkMobileCategoriesScroll()
      }, 120)
      return () => clearTimeout(timeout)
    }
  }, [showAllCategories, activeCategory, isMobile])

  // Prevent background scroll when overlay is open
  useEffect(() => {
    if (showAllCategories) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [showAllCategories])

  // Load recent searches initially and whenever the overlay opens
  useEffect(() => {
    loadRecentSearches()
  }, [])

  useEffect(() => {
    if (showAllCategories) {
      loadRecentSearches()
    }
  }, [showAllCategories])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === RECENT_SEARCHES_KEY) {
        loadRecentSearches()
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

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
            <span className="hidden sm:inline">{t("categories.allCategories")}</span>
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
            <span>{translateCategory(item.nameKey, language)}</span>
          </button>
        ))}
      </nav>

      {showAllCategories && (
        isMobile ? (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div
              ref={mobileSheetRef}
              className="absolute inset-x-0 bottom-0 max-h-[88vh] bg-white rounded-t-2xl shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Grid className="h-5 w-5 text-green-700" />
                  <span className="text-base font-semibold text-gray-900">{t("categories.allCategories")}</span>
                </div>
                <button
                  onClick={() => setShowAllCategories(false)}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                  aria-label="Close categories"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative flex-1 overflow-hidden">
                <div
                  ref={mobileCategoriesRef}
                  onScroll={checkMobileCategoriesScroll}
                  className="overflow-y-auto custom-scrollbar px-4 py-2"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="space-y-4">
                    {ALL_CATEGORIES.map((category) => (
                      <div key={category.slug} className="pb-4 border-b border-gray-100 last:border-b-0">
                        <button
                          onClick={() => handleMainCategoryNavigate(category.name)}
                          className="w-full text-left text-sm font-semibold text-gray-900 mb-2.5 flex items-center justify-between py-1"
                        >
                          <span>{translateCategory(category.name, language)}</span>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </button>
                        <div className="flex flex-wrap gap-2">
                          {category.subcategories.map((subcategory) => (
                            <button
                              key={subcategory.slug}
                              onClick={() => handleSubcategoryClick(category.name, subcategory.name)}
                              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-green-600 hover:bg-green-50 hover:text-green-800 active:scale-95 transition-all"
                            >
                              {translateSubcategory(subcategory.name, language)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white to-transparent"></div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                <div className="absolute right-3 bottom-4 flex flex-col gap-2">
                  {mobileCanScrollUp && (
                    <button
                      onClick={() => scrollMobileCategories(-200)}
                      className="pointer-events-auto rounded-full border border-gray-200 bg-white p-2 text-gray-500 shadow hover:text-green-700"
                      aria-label="Scroll up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  )}
                  {mobileCanScrollDown && (
                    <button
                      onClick={() => scrollMobileCategories(200)}
                      className="pointer-events-auto rounded-full border border-gray-200 bg-white p-2 text-gray-500 shadow hover:text-green-700"
                      aria-label="Scroll down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="absolute top-full left-0 z-50 mt-1 w-[820px] min-h-[420px] max-h-[70vh] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
            ref={dropdownRef}
          >
            <div className="flex h-full min-h-[420px]">
              <div className="relative flex h-full w-2/5 flex-col bg-gray-900 p-4 text-white">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wide text-gray-200">
                    {t("categories.allCategories")}
                  </span>
                </div>

                {canScrollUp && (
                  <button
                    onClick={scrollCategoriesUp}
                    className="absolute right-3 top-3 rounded-full bg-gray-800 p-1 text-white shadow hover:bg-gray-700"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}

                <div
                  ref={categoriesListRef}
                  onScroll={checkCategoriesScroll}
                  className="custom-scrollbar max-h-[calc(70vh-6rem)] flex-1 overflow-y-auto pr-2"
                >
                  {ALL_CATEGORIES.map((category) => (
                    <button
                      key={category.slug}
                      onClick={() => handleCategoryClick(category.slug)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        activeCategory === category.slug
                          ? "bg-green-600 text-white shadow"
                          : "text-gray-200 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <span>{translateCategory(category.name, language)}</span>
                      {category.subcategories.length > 0 && (
                        <ChevronRight className="h-3 w-3 opacity-60" />
                      )}
                    </button>
                  ))}
                </div>

                {canScrollDown && (
                  <button
                    onClick={scrollCategoriesDown}
                    className="absolute bottom-3 right-3 rounded-full bg-gray-800 p-1 text-white shadow hover:bg-gray-700"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="w-3/5 border-l border-gray-200 bg-gray-50">
                {activeCategoryData ? (
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{translateCategory(activeCategoryData.name, language)}</p>
                        <p className="text-xs text-gray-500">Select a subcategory to refine</p>
                      </div>
                      <button
                        onClick={() => handleMainCategoryNavigate(activeCategoryData.name)}
                        className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-200"
                      >
                        View All
                      </button>
                    </div>

                    <div
                      ref={subcategoriesListRef}
                      className="custom-scrollbar flex-1 overflow-y-auto px-4 py-3"
                    >
                      <div className="grid grid-cols-1 gap-2">
                        {activeCategoryData.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.slug}
                            onClick={() => handleSubcategoryClick(activeCategoryData.name, subcategory.name)}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-green-600 hover:bg-green-50 hover:text-green-900"
                          >
                            <ChevronRight className="h-3 w-3 text-green-600" />
                            <span>{translateSubcategory(subcategory.name, language)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col gap-4 px-8 py-6">
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <Sparkles className="h-4 w-4 text-green-600" />
                          {t("categories.trendingSearches")}
                        </div>
                        <button
                          onClick={() => setShowAllCategories(false)}
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                          aria-label="Close categories"
                        >
                          {t("categories.close")}
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {TRENDING_SEARCHES.slice(0, 3).map((item, index) => (
                          <button
                            key={item.query}
                            onClick={() => handleTrendingClick(item.query)}
                            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-green-600 hover:bg-green-50 hover:text-green-700 whitespace-nowrap flex-shrink-0"
                          >
                            <span className="text-xs font-semibold text-gray-400">
                              {index + 1}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <Clock className="h-4 w-4 text-green-600" />
                          {t("categories.recentSearches")}
                        </div>
                        {recentSearches.length > 0 && (
                          <button
                            onClick={() => {
                              setRecentSearches([])
                              if (typeof window !== "undefined") {
                                localStorage.removeItem(RECENT_SEARCHES_KEY)
                              }
                            }}
                            className="text-xs font-medium text-gray-500 hover:text-red-600"
                          >
                            {t("categories.clear")}
                          </button>
                        )}
                      </div>
                      {recentSearches.length === 0 ? (
                        <div className="text-xs text-gray-500 text-center py-2">
                          {t("categories.noRecentSearches")}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                          {recentSearches.slice(0, 3).map((query) => (
                            <div
                              key={query}
                              className="group relative flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-green-600 hover:bg-green-50 hover:text-green-700 whitespace-nowrap flex-shrink-0"
                            >
                              <button
                                onClick={() => {
                                  saveSearchToHistory(query, setRecentSearches)
                                  handleRecentClick(query)
                                }}
                                className="flex items-center gap-2 flex-1"
                              >
                                <span className="truncate max-w-[120px]">{query}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveRecent(query)
                                }}
                                className="ml-1 rounded-full p-0.5 text-gray-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100 flex-shrink-0"
                                aria-label={`Remove ${query} from recent searches`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  )
}
