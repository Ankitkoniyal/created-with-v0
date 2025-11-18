"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { 
  Car, Home, Smartphone, Shirt, Sofa, Briefcase, Wrench, Book, 
  Search, TrendingUp, ChevronRight, X, Gamepad2, PawPrint 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Import categories config for subcategories (subcategories are not in DB, only in config)
import { CATEGORY_CONFIG, getCategorySlug, getSubcategorySlug } from "@/lib/categories"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

// Map icons to categories
const CATEGORY_ICONS: Record<string, typeof Car> = {
  "Home Appliances": Home,
  "Electronics": Smartphone,
  "Services": Wrench,
  "Vehicles": Car,
  "Furniture": Sofa,
  "Mobile": Smartphone,
  "Real Estate": Home,
  "Fashion & Beauty": Shirt,
  "Pets & Animals": PawPrint,
  "Sports": TrendingUp,
  "Books & Education": Book,
  "Free Stuff": Wrench,
}

const CATEGORY_COLORS: Record<string, { color: string; bgColor: string }> = {
  "Home Appliances": { color: "text-orange-400", bgColor: "bg-orange-900" },
  "Electronics": { color: "text-green-400", bgColor: "bg-green-900" },
  "Services": { color: "text-gray-400", bgColor: "bg-gray-900" },
  "Vehicles": { color: "text-blue-400", bgColor: "bg-blue-900" },
  "Furniture": { color: "text-amber-400", bgColor: "bg-amber-900" },
  "Mobile": { color: "text-cyan-400", bgColor: "bg-cyan-900" },
  "Real Estate": { color: "text-purple-400", bgColor: "bg-purple-900" },
  "Fashion & Beauty": { color: "text-pink-400", bgColor: "bg-pink-900" },
  "Pets & Animals": { color: "text-red-400", bgColor: "bg-red-900" },
  "Sports": { color: "text-teal-400", bgColor: "bg-teal-900" },
  "Books & Education": { color: "text-emerald-400", bgColor: "bg-emerald-900" },
  "Free Stuff": { color: "text-gray-400", bgColor: "bg-gray-900" },
}

interface MegaMenuProps {
  onClose?: () => void
  isOpen?: boolean
}

interface CategoryWithSubs {
  name: string
  slug: string
  icon: typeof Car
  color: string
  bgColor: string
  subcategories: Array<{ name: string; slug: string }>
}

export default function MegaMenu({ onClose, isOpen }: MegaMenuProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<CategoryWithSubs[]>([])
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch categories and subcategories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const supabase = createClient()
        
        // Fetch categories from database
        const { data: dbCategories } = await supabase
          .from("categories")
          .select("id, name, slug")
          .order("name")

        // Fetch subcategories from database (with error handling)
        let dbSubcategories: any[] = []
        try {
          const { data, error } = await supabase
            .from("subcategories")
            .select("id, name, slug, category_slug")
            .order("name")
          if (!error && data) {
            dbSubcategories = data
          }
        } catch (err) {
          console.warn("Could not fetch subcategories from DB, will use config fallback:", err)
        }

        if (dbCategories && dbCategories.length > 0) {
          // Merge DB categories with DB subcategories
          const merged = dbCategories.map((dbCat) => {
            const categorySlug = dbCat.slug || getCategorySlug(dbCat.name)
            // Get subcategories for this category from database
            const categorySubs = dbSubcategories
              .filter((sub) => sub.category_slug === categorySlug)
              .map((sub) => ({
                name: sub.name,
                slug: sub.slug || getSubcategorySlug(sub.name),
              }))
            
            const icon = CATEGORY_ICONS[dbCat.name] || Wrench
            const colors = CATEGORY_COLORS[dbCat.name] || { color: "text-gray-400", bgColor: "bg-gray-900" }
            
            return {
              name: dbCat.name,
              slug: categorySlug,
              icon,
              ...colors,
              subcategories: categorySubs,
            }
          })
          setCategories(merged)
        } else {
          // Fallback to config if DB is empty
          const fallback = CATEGORY_CONFIG.map((config) => {
            const icon = CATEGORY_ICONS[config.name] || Wrench
            const colors = CATEGORY_COLORS[config.name] || { color: "text-gray-400", bgColor: "bg-gray-900" }
            return {
              name: config.name,
              slug: config.slug,
              icon,
              ...colors,
              subcategories: config.subcategories.map((sub) => ({
                name: sub.name,
                slug: sub.slug ?? getSubcategorySlug(sub.name),
              })),
            }
          })
          setCategories(fallback)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        // Fallback to config on error
        const fallback = CATEGORY_CONFIG.map((config) => {
          const icon = CATEGORY_ICONS[config.name] || Wrench
          const colors = CATEGORY_COLORS[config.name] || { color: "text-gray-400", bgColor: "bg-gray-900" }
          return {
            name: config.name,
            slug: config.slug,
            icon,
            ...colors,
            subcategories: config.subcategories.map((sub) => ({
              name: sub.name,
              slug: sub.slug ?? getSubcategorySlug(sub.name),
            })),
          }
        })
        setCategories(fallback)
      }
    }

    fetchCategories()
  }, [])

  if (!isOpen) return null

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.subcategories.some(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div ref={menuRef} className="fixed inset-x-4 top-20 z-50 w-auto max-w-6xl mx-auto bg-gray-900 shadow-2xl rounded-xl border border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white ml-4">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {searchQuery && (
          <div className="mb-4 text-sm text-gray-400">
            Found {filteredCategories.length} categories matching "{searchQuery}"
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category) => {
            const IconComponent = category.icon
            
            return (
              <div key={category.slug} className="space-y-3">
                {/* Category Header */}
                <Link
                  href={`/search?category=${category.slug}`}
                  className="flex items-center gap-3 font-semibold text-white hover:text-green-400 text-base group"
                  onClick={onClose}
                >
                  <div className={`w-10 h-10 ${category.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`w-5 h-5 ${category.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{category.name}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-400" />
                  </div>
                </Link>

                {/* Subcategories */}
                <div className="space-y-1.5 ml-13">
                  {category.subcategories.slice(0, 6).map((subcategory) => (
                    <Link
                      key={subcategory.slug}
                      href={`/search?category=${category.slug}&subcategory=${subcategory.slug}`}
                      className="flex items-center gap-2 text-gray-300 hover:text-green-400 text-sm hover:bg-gray-800 px-3 py-2 rounded-md transition-colors group"
                      onClick={onClose}
                    >
                      <span className="truncate">{subcategory.name}</span>
                    </Link>
                  ))}
                  
                  {category.subcategories.length > 6 && (
                    <Link
                      href={`/search?category=${category.slug}`}
                      className="text-xs text-gray-400 hover:text-green-400 px-3 py-1 transition-colors block"
                      onClick={onClose}
                    >
                      +{category.subcategories.length - 6} more
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No categories found</h3>
            <p className="text-gray-400">Try searching with different keywords</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 bg-gray-800 px-6 py-4 rounded-b-xl">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-gray-300">Popular:</span>
          <div className="flex gap-4">
            {["Apartments for Rent", "Used Cars", "iPhone", "Furniture"].map((item) => (
              <Link
                key={item}
                href={`/search?q=${encodeURIComponent(item)}`}
                className="text-sm text-gray-400 hover:text-green-400 hover:underline"
                onClick={onClose}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
