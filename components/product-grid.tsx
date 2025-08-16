"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
// import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

const allProducts = [
  {
    id: 1,
    title: "iPhone 14 Pro Max - Excellent Condition",
    price: "$899",
    location: "TORONTO, ON",
    timePosted: "4 DAYS AGO",
    image: "/iphone-14-pro-max.png",
    featured: true,
    rating: 4.8,
    reviewCount: 127,
  },
  {
    id: 2,
    title: "2019 Honda Civic - Low Mileage",
    price: "$18,500",
    location: "VANCOUVER, BC",
    timePosted: "JUL 25",
    image: "/honda-civic.png",
    featured: true,
    rating: 4.6,
    reviewCount: 89,
  },
  {
    id: 3,
    title: "Modern Sofa Set - Like New",
    price: "$650",
    location: "MONTREAL, QC",
    timePosted: "TODAY",
    image: "/modern-sofa.png",
    featured: false,
    rating: 4.9,
    reviewCount: 203,
  },
  {
    id: 4,
    title: "Gaming Laptop - RTX 3070",
    price: "$1,200",
    location: "CALGARY, AB",
    timePosted: "TODAY",
    image: "/gaming-laptop.png",
    featured: false,
    rating: 4.7,
    reviewCount: 156,
  },
  {
    id: 5,
    title: "Vintage Leather Jacket",
    price: "$85",
    location: "OTTAWA, ON",
    timePosted: "2 DAYS AGO",
    image: "/vintage-leather-jacket.png",
    featured: false,
    rating: 4.5,
    reviewCount: 67,
  },
  {
    id: 6,
    title: "Mountain Bike - Trek 2021",
    price: "$450",
    location: "EDMONTON, AB",
    timePosted: "JUL 23",
    image: "/trek-mountain-bike.png",
    featured: true,
    rating: 4.8,
    reviewCount: 94,
  },
  {
    id: 7,
    title: "iPhone 13 - Good Condition",
    price: "$599",
    location: "WINNIPEG, MB",
    timePosted: "TODAY",
    image: "/iphone-13.png",
    featured: false,
    rating: 4.4,
    reviewCount: 78,
  },
  {
    id: 8,
    title: "Dining Table Set - Oak Wood",
    price: "$350",
    location: "HALIFAX, NS",
    timePosted: "JUL 24",
    image: "/rustic-oak-table.png",
    featured: false,
    rating: 4.9,
    reviewCount: 112,
  },
  {
    id: 9,
    title: "Samsung Galaxy S23 Ultra",
    price: "$750",
    location: "SASKATOON, SK",
    timePosted: "3 HOURS AGO",
    image: "/samsung-galaxy-phone.png",
    featured: false,
    rating: 4.6,
    reviewCount: 145,
  },
  {
    id: 10,
    title: "MacBook Air M2 - Like New",
    price: "$1,100",
    location: "VICTORIA, BC",
    timePosted: "1 DAY AGO",
    image: "/sleek-macbook-air.png",
    featured: true,
    rating: 4.8,
    reviewCount: 189,
  },
  {
    id: 11,
    title: "Sectional Couch - Grey",
    price: "$800",
    location: "REGINA, SK",
    timePosted: "2 DAYS AGO",
    image: "/grey-sectional-couch.png",
    featured: false,
    rating: 4.7,
    reviewCount: 98,
  },
  {
    id: 12,
    title: "2020 Toyota Camry",
    price: "$22,000",
    location: "LONDON, ON",
    timePosted: "JUL 22",
    image: "/toyota-camry-sedan.png",
    featured: false,
    rating: 4.5,
    reviewCount: 76,
  },
  {
    id: 13,
    title: "Electric Guitar - Fender",
    price: "$650",
    location: "QUEBEC CITY, QC",
    timePosted: "5 HOURS AGO",
    image: "/fender-electric-guitar.png",
    featured: false,
    rating: 4.9,
    reviewCount: 134,
  },
  {
    id: 14,
    title: "Treadmill - NordicTrack",
    price: "$400",
    location: "KITCHENER, ON",
    timePosted: "TODAY",
    image: "/nordictrack-treadmill.png",
    featured: false,
    rating: 4.3,
    reviewCount: 87,
  },
  {
    id: 15,
    title: "Wedding Dress - Size 8",
    price: "$300",
    location: "CHARLOTTETOWN, PE",
    timePosted: "JUL 21",
    image: "/white-wedding-dress.png",
    featured: false,
    rating: 4.8,
    reviewCount: 45,
  },
  {
    id: 16,
    title: "PlayStation 5 Console",
    price: "$550",
    location: "THUNDER BAY, ON",
    timePosted: "6 HOURS AGO",
    image: "/playstation-5-console.png",
    featured: true,
    rating: 4.7,
    reviewCount: 167,
  },
  {
    id: 17,
    title: "Dining Room Table - Marble",
    price: "$900",
    location: "BURNABY, BC",
    timePosted: "1 DAY AGO",
    image: "/placeholder-z5gxr.png",
    featured: false,
    rating: 4.6,
    reviewCount: 92,
  },
  {
    id: 18,
    title: "Canon DSLR Camera",
    price: "$450",
    location: "MISSISSAUGA, ON",
    timePosted: "JUL 20",
    image: "/canon-dslr.png",
    featured: false,
    rating: 4.8,
    reviewCount: 123,
  },
  {
    id: 19,
    title: "Baby Stroller - Chicco",
    price: "$120",
    location: "SURREY, BC",
    timePosted: "TODAY",
    image: "/stylish-baby-stroller.png",
    featured: false,
    rating: 4.5,
    reviewCount: 68,
  },
  {
    id: 20,
    title: "Office Chair - Ergonomic",
    price: "$180",
    location: "BRAMPTON, ON",
    timePosted: "2 HOURS AGO",
    image: "/ergonomic-office-chair.png",
    featured: false,
    rating: 4.4,
    reviewCount: 89,
  },
  {
    id: 21,
    title: "iPad Pro 12.9 inch",
    price: "$800",
    location: "LAVAL, QC",
    timePosted: "JUL 19",
    image: "/ipad-pro-tablet.png",
    featured: false,
    rating: 4.9,
    reviewCount: 178,
  },
  {
    id: 22,
    title: "Bookshelf - Solid Wood",
    price: "$150",
    location: "HAMILTON, ON",
    timePosted: "3 DAYS AGO",
    image: "/wooden-bookshelf.png",
    featured: false,
    rating: 4.6,
    reviewCount: 54,
  },
  {
    id: 23,
    title: "Nike Air Jordan Sneakers",
    price: "$220",
    location: "MARKHAM, ON",
    timePosted: "TODAY",
    image: "/classic-sneakers.png",
    featured: false,
    rating: 4.7,
    reviewCount: 143,
  },
  {
    id: 24,
    title: "Washing Machine - LG",
    price: "$400",
    location: "GATINEAU, QC",
    timePosted: "1 DAY AGO",
    image: "/placeholder-4ma5g.png",
    featured: false,
    rating: 4.5,
    reviewCount: 91,
  },
]

export function ProductGrid() {
  const { user } = useAuth()
  const [visibleCount, setVisibleCount] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  const toggleFavorite = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setFavorites((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const visibleProducts = allProducts.slice(0, visibleCount)
  const hasMore = visibleCount < allProducts.length

  const loadMore = () => {
    setIsLoading(true)
    // Simulate loading delay
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 12, allProducts.length))
      setIsLoading(false)
    }, 500)
  }

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-foreground">Latest Ads</h3>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 mb-6">
          {visibleProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 h-full flex flex-col overflow-hidden border border-gray-300 bg-white rounded-none">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-full object-cover object-center"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 bg-white hover:bg-gray-50 shadow-sm p-0.5 h-5 w-5 z-10 rounded-none"
                      onClick={(e) => toggleFavorite(product.id, e)}
                    >
                      <Heart
                        className={`h-2.5 w-2.5 ${favorites.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                      />
                    </Button>
                    {product.featured && (
                      <Badge className="absolute top-1 left-1 bg-yellow-500 text-black text-xs font-semibold px-1 py-0.5 uppercase tracking-wide rounded-none">
                        Featured
                      </Badge>
                    )}
                  </div>

                  <div className="p-1.5 flex flex-col flex-1 bg-white">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-bold text-black">{product.price}</p>
                      <div className="flex items-center gap-0.5">
                        <span className="text-yellow-500 text-xs">★</span>
                        <span className="text-xs text-gray-700">{product.rating}</span>
                      </div>
                    </div>

                    <h4 className="text-xs text-gray-700 leading-tight line-clamp-2 mb-1 min-h-[1.25rem]">
                      {product.title}
                    </h4>

                    <div className="flex flex-col text-xs text-gray-500 uppercase tracking-wide mt-auto space-y-0.5">
                      <span className="font-medium truncate">{product.location}</span>
                      <span className="text-xs">{product.timePosted}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <Button
              onClick={loadMore}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 text-sm font-medium"
            >
              {isLoading ? "Loading..." : "Show More"}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
