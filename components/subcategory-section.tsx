import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/mock-data"

interface SubcategorySectionProps {
  category: Category
  selectedSubcategory?: string
}

export function SubcategorySection({ category, selectedSubcategory }: SubcategorySectionProps) {
  if (!category.subcategories || category.subcategories.length === 0) {
    return null
  }

  return (
    <div className="bg-white py-6 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{category.name} Categories</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* All Items Button */}
          <Button
            variant={!selectedSubcategory ? "default" : "outline"}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              !selectedSubcategory
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                : "border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 bg-white text-gray-700"
            }`}
            asChild
          >
            <Link href={`/category/${category.slug}`} className="flex items-center gap-2">
              <span className="text-lg">{category.icon}</span>
              <span>All {category.name}</span>
            </Link>
          </Button>

          {/* Subcategory Buttons */}
          {category.subcategories.map((subcategory) => (
            <Button
              key={subcategory.id}
              variant={selectedSubcategory === subcategory.slug ? "default" : "outline"}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedSubcategory === subcategory.slug
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  : "border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 bg-white text-gray-700"
              }`}
              asChild
            >
              <Link href={`/category/${category.slug}/${subcategory.slug}`} className="whitespace-nowrap">
                {subcategory.name}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
