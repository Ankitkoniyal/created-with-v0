import { SearchResults } from "@/components/search/search-results"
import { SearchFilters } from "@/components/search/search-filters"
import { Breadcrumb } from "@/components/breadcrumb"

interface SearchPageProps {
  searchParams: {
    q?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    condition?: string
    location?: string
    sortBy?: string
  }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""
  const filters = {
    category: searchParams.category || "",
    minPrice: searchParams.minPrice || "",
    maxPrice: searchParams.maxPrice || "",
    condition: searchParams.condition || "",
    location: searchParams.location || "",
    sortBy: searchParams.sortBy || "relevance",
  }

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
            <SearchResults searchQuery={query} filters={filters} />
          </div>
        </div>
      </div>
    </div>
  )
}
