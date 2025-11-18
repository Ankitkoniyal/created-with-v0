"use client"

import {
  Car,
  Smartphone,
  Home,
  Shirt,
  Book,
  Wrench,
  PawPrint,
  Sofa,
  Phone,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getCategorySlug } from "@/lib/categories"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

// Map icons to categories
const CATEGORY_ICONS: Record<string, typeof Car> = {
  "Home Appliances": Home,
  "Electronics": Smartphone,
  "Services": Wrench,
  "Vehicles": Car,
  "Furniture": Sofa,
  "Mobile": Phone,
  "Real Estate": Home,
  "Fashion & Beauty": Shirt,
  "Pets & Animals": PawPrint,
  "Sports": TrendingUp,
  "Books & Education": Book,
  "Free Stuff": Wrench,
}

interface CategoryItem {
  name: string
  icon: typeof Car
  slug: string
}

export function CategoryNav() {
  const [categories, setCategories] = useState<CategoryItem[]>([])

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const supabase = createClient()
        const { data: dbCategories } = await supabase
          .from("categories")
          .select("id, name, slug")
          .order("name")

        if (dbCategories && dbCategories.length > 0) {
          const mapped = dbCategories.map((cat) => ({
            name: cat.name,
            slug: cat.slug || getCategorySlug(cat.name),
            icon: CATEGORY_ICONS[cat.name] || Wrench,
          }))
          setCategories(mapped)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  return (
    <section className="py-8 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl font-bold text-foreground mb-6">Browse Categories</h3>
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 lg:gap-3">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.name}
                variant="ghost"
                className="flex flex-col items-center p-2 lg:p-3 h-auto hover:bg-green-50 hover:text-green-600 hover:border-green-200 hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out border border-transparent rounded-lg group"
                asChild
              >
                <Link href={`/search?category=${category.slug}`}>
                  <Icon className="h-6 w-6 lg:h-8 lg:w-8 mb-1 lg:mb-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-xs lg:text-sm font-medium text-center leading-tight">{category.name}</span>
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
