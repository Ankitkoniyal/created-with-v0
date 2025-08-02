// app/search/page.tsx
"use client"

import type React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/utils/supabaseClient"
import { AdCard } from "@/components/ad-card" // CORRECTED: import path is now all lowercase
import { AdvancedSearchFilters } from "@/components/advanced-search-filters"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, SlidersHorizontal } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { useToast } from "@/components/ui/use-toast"

// Re-using the Ad type from AdCard, as it matches Supabase data structure
interface Ad {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category_id: string | null;
  user_id: string;
  images: string[] | null;
  location: string | null;
  condition: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  negotiable?: boolean;
  profiles: {
    full_name: string | null;
  } | null;
}

interface FilterState {
  searchQuery: string;
  category: string;
  priceMin: string;
  priceMax: string;
  condition: string;
  location: string;
  city: string;
  state: string;
  brand: string;
  yearMin: string;
  yearMax: string;
  negotiable: boolean | null;
  sortBy: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [filters, setFilters] = useState<FilterState>(() => ({
    searchQuery: searchParams.get("q") || "",
    category: searchParams.get("category") || "all",
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    condition: searchParams.get("condition") || "any",
    location: searchParams.get("location") || "",
    city: searchParams.get("city") || "any",
    state: searchParams.get("state") || "any",
    brand: searchParams.get("brand") || "any",
    yearMin: searchParams.get("yearMin") || "",
    yearMax: searchParams.get("yearMax") || "",
    negotiable: searchParams.get("negotiable") === "true",
    sortBy: searchParams.get("sortBy") || "newest",
  }));

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('ads')
      .select(`*, profiles(full_name)`)
      .eq('status', 'active');

    // Apply search query
    if (filters.searchQuery) {
      const searchTerm = `%${filters.searchQuery.toLowerCase()}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    // Apply category filter
    if (filters.category !== "all") {
      query = query.eq('category_id', filters.category);
    }

    // Apply condition filter
    if (filters.condition !== "any") {
      query = query.eq('condition', filters.condition);
    }

    // Apply price range filters
    if (filters.priceMin) {
      query = query.gte('price', parseFloat(filters.priceMin));
    }
    if (filters.priceMax) {
      query = query.lte('price', parseFloat(filters.priceMax));
    }

    // Apply negotiable filter
    if (filters.negotiable !== null) {
      query = query.eq('negotiable', filters.negotiable);
    }
    
    // Apply location filter (as your DB schema uses it)
    if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "oldest":
        query = query.order('created_at', { ascending: true });
        break;
      case "price_low":
        query = query.order('price', { ascending: true });
        break;
      case "price_high":
        query = query.order('price', { ascending: false });
        break;
      case "title":
        query = query.order('title', { ascending: true });
        break;
      case "newest":
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching ads:", fetchError.message);
      setError("Failed to load ads. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load ads: " + fetchError.message,
        variant: "destructive"
      });
    } else {
      setAds(data as Ad[]);
    }
    setLoading(false);
  }, [filters, toast]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("q", filters.searchQuery);
    router.push(`/search?${newSearchParams.toString()}`);
  };

  const clearAllFilters = () => {
    setFilters({
      searchQuery: "",
      category: "all",
      priceMin: "",
      priceMax: "",
      condition: "any",
      location: "",
      city: "any",
      state: "any",
      brand: "any",
      yearMin: "",
      yearMax: "",
      negotiable: null,
      sortBy: "newest",
    });
    router.push('/search');
  };

  const getActiveFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "searchQuery" && value !== "") return true;
      if (key === "sortBy" && value !== "newest") return true;
      if (key === "negotiable" && value !== null) return true;
      if (["category", "condition", "location", "city", "state", "brand", "priceMin", "priceMax", "yearMin", "yearMax"].includes(key) && value !== "" && value !== "any") return true;
      return false;
    }).length;
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">
            {filters.searchQuery ? `Search results for "${filters.searchQuery}"` : "Browse All Ads"}
          </h1>

          {/* Quick Search Bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for products, brands, models..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Button type="button" variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters {getActiveFiltersCount > 0 && `(${getActiveFiltersCount})`}
              </Button>
            </form>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <AdvancedSearchFilters filters={filters} onFiltersChange={setFilters} onClearFilters={clearAllFilters} />
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {loading ? "Loading..." : `${ads.length} ${ads.length === 1 ? "result" : "results"} found`}
              {getActiveFiltersCount > 0 && ` with ${getActiveFiltersCount} filter${getActiveFiltersCount === 1 ? "" : "s"} applied`}
            </p>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading ads...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">Error: {error}</div>
        ) : ads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <p className="text-gray-500 text-lg mb-2">No ads found matching your criteria.</p>
              <p className="text-gray-400 mb-4">Try adjusting your search filters or search terms.</p>
              {getActiveFiltersCount > 0 && (
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}