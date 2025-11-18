// components/subcategory-nav.tsx - COMPLETE FIXED VERSION
"use client"

import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { getSubcategorySlug, getCategorySlug } from "@/lib/categories"
import { createClient } from "@/lib/supabase/client"

interface SubcategoryNavProps {
  category: string
  selectedSubcategory?: string
}

export function SubcategoryNav({ category, selectedSubcategory }: SubcategoryNavProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([])

  // Fetch subcategories from database with fallback to config
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!category) {
        setAvailableSubcategories([])
        return
      }

      try {
        const supabase = createClient()
        const categorySlug = getCategorySlug(category)
        
        const { data: dbSubcategories, error } = await supabase
          .from("subcategories")
          .select("name, slug")
          .eq("category_slug", categorySlug)
          .order("name")

        if (!error && dbSubcategories && dbSubcategories.length > 0) {
          setAvailableSubcategories(dbSubcategories.map((sub) => sub.name))
        } else {
          // Fallback to config if DB fails or empty
          const { getSubcategoriesByCategory } = await import("@/lib/categories")
          const configSubs = getSubcategoriesByCategory(category)
          setAvailableSubcategories(configSubs)
        }
      } catch (error) {
        console.warn("Error fetching subcategories from DB, using config fallback:", error)
        // Fallback to config on error
        try {
          const { getSubcategoriesByCategory } = await import("@/lib/categories")
          const configSubs = getSubcategoriesByCategory(category)
          setAvailableSubcategories(configSubs)
        } catch (fallbackError) {
          console.error("Config fallback also failed:", fallbackError)
          setAvailableSubcategories([])
        }
      }
    }

    fetchSubcategories()
  }, [category])

  const updateUrl = useCallback(
    (subcategory: string | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (subcategory === null || subcategory === "all") {
        params.delete("subcategory")
      } else {
        // Convert to consistent lowercase slug
        const slug = getSubcategorySlug(subcategory)
        params.set("subcategory", slug)
      }

      router.push(`/search?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  if (!category || availableSubcategories.length === 0) {
    return null
  }

  const isSubcategorySelected = (subcategory: string) => {
    if (!selectedSubcategory || selectedSubcategory === "all") return false
    return selectedSubcategory === getSubcategorySlug(subcategory)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse {category} Categories</h3>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={!selectedSubcategory || selectedSubcategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => updateUrl("all")}
            className={
              !selectedSubcategory || selectedSubcategory === "all"
                ? "bg-green-900 hover:bg-green-950 text-white"
                : "border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50 hover:text-green-900"
            }
          >
            All {category}
          </Button>

          {availableSubcategories.map((subcategory) => {
            const isSelected = isSubcategorySelected(subcategory)
            
            return (
              <Button
                key={subcategory}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => updateUrl(subcategory)}
                className={
                  isSelected
                    ? "bg-green-900 hover:bg-green-950 text-white"
                    : "border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50 hover:text-green-900"
                }
              >
                {subcategory}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
