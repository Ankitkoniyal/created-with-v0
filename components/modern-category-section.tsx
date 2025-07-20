import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Smartphone,
  Car,
  Sofa,
  Shirt,
  Trophy,
  Music,
  BookOpen,
  Grid3X3,
  Briefcase,
  Heart,
  Bike,
  Home,
  Zap,
} from "lucide-react"

const categoryIcons = {
  "1": Smartphone, // Electronics
  "2": Car, // Car
  "3": Sofa, // Furniture
  "4": Shirt, // Clothing
  "5": Trophy, // Sports
  "6": Music, // Music
  "7": BookOpen, // Books
  "8": Heart, // Pets
  "9": Briefcase, // Services
  "10": Bike, // Bike
  "11": Home, // Real Estate
  "12": Zap, // Home Appliance
}

const categories = [
  { id: "1", name: "Electronics", slug: "electronics", color: "bg-blue-500" }, // Updated from Mobile
  { id: "2", name: "Car", slug: "car", color: "bg-red-500" },
  { id: "3", name: "Furniture", slug: "furniture", color: "bg-amber-500" },
  { id: "4", name: "Clothing", slug: "clothing", color: "bg-pink-500" },
  { id: "5", name: "Sports", slug: "sports", color: "bg-green-500" },
  { id: "6", name: "Music", slug: "music", color: "bg-purple-500" },
  { id: "7", name: "Books", slug: "books", color: "bg-orange-500" },
  { id: "8", name: "Pets", slug: "pets", color: "bg-rose-500" },
  { id: "9", name: "Services", slug: "services", color: "bg-indigo-500" },
  { id: "10", name: "Bike", slug: "bike", color: "bg-emerald-500" }, // Fixed slug
  { id: "11", name: "Real Estate", slug: "real-estate", color: "bg-teal-500" },
  { id: "12", name: "Home Appliance", slug: "home-appliance", color: "bg-cyan-500" },
]

export function ModernCategorySection() {
  return (
    <div className="bg-white py-8 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop: Single row, Mobile: Responsive grid */}
        <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
          {/* All Categories Button */}
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-sm lg:text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
            asChild
          >
            <Link href="/search" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              All Categories
            </Link>
          </Button>

          {/* Category Buttons */}
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.id as keyof typeof categoryIcons]
            return (
              <Button
                key={category.id}
                variant="outline"
                className="px-4 py-3 lg:px-6 rounded-full border-gray-200 hover:border-transparent hover:text-white hover:shadow-lg transition-all duration-200 bg-white text-gray-700 font-medium text-sm lg:text-base group"
                style={
                  {
                    "--hover-bg": category.color.replace("bg-", ""),
                  } as React.CSSProperties
                }
                asChild
              >
                <Link
                  href={`/category/${category.slug}`}
                  className={`flex items-center gap-2 hover:${category.color} transition-colors`}
                >
                  <IconComponent className="h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="whitespace-nowrap">{category.name}</span>
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
