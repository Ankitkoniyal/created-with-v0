// components/subcategory-nav.tsx - COMPLETE FIXED VERSION
"use client"

import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { SUBCATEGORY_MAPPINGS, getSubcategorySlug } from "@/lib/categories"

interface SubcategoryNavProps {
  category: string
  selectedSubcategory?: string
}

export function SubcategoryNav({ category, selectedSubcategory }: SubcategoryNavProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

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

  const availableSubcategories = SUBCATEGORY_MAPPINGS[category] || []

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
