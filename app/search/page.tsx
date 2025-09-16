"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { SearchResults } from "@/components/search/search-results"
import SearchFilters from "@/components/search/search-filters"
import { SubcategoryNav } from "@/components/subcategory-nav"
import { Breadcrumb } from "@/components/breadcrumb"

export default function SearchPage() {
  const searchParams = useSearchParams()

  const query = searchParams.get("q") || ""

  const filters = useMemo(
    () => ({
      category: searchParams.get("category") || "",
      subcategory: searchParams.get("subcategory") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      condition: searchParams.get("condition") || "",
      location: searchParams.get("location") || "",
      sortBy: searchParams.get("sortBy") || "relevance",
    }),
    [searchParams],
  )

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: `Search${query ? ` for "${query}"` : ""}`, href: `/search${query ? `?q=${query}` : ""}` },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {query ? `Search results for "${query}"` : "Browse Products"}
          </h1>
          <p className="text-muted-foreground">Find exactly what you're looking for</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <SearchFilters currentFilters={filters} searchQuery={query} />
          </div>
          <div className="lg:col-span-3">
            {filters.category && (
              <SubcategoryNav category={filters.category} selectedSubcategory={filters.subcategory} />
            )}
            <SearchResults searchQuery={query} filters={filters} />
          </div>
        </div>
      </div>
    </div>
  )
}
