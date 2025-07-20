import Link from "next/link"
import { Button } from "@/components/ui/button"
import { mockCategories } from "@/lib/mock-data"
import { Grid3X3 } from "lucide-react"

export function CategorySection() {
  return (
    <div className="bg-white py-6 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop: Single row, Mobile: Two rows */}
        <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
          {/* All Categories Button */}
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-full text-sm lg:text-base font-medium"
            asChild
          >
            <Link href="/search">
              <Grid3X3 className="h-4 w-4 mr-2" />
              All Categories
            </Link>
          </Button>

          {/* Category Buttons */}
          {mockCategories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              className="px-4 py-2 lg:px-6 lg:py-3 rounded-full border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 bg-white text-sm lg:text-base font-medium"
              asChild
            >
              <Link href={`/category/${category.slug}`} className="flex items-center space-x-2">
                <span className="text-lg lg:text-xl">{category.icon}</span>
                <span className="whitespace-nowrap">{category.name}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
