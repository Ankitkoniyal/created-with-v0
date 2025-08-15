"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Latest ads data - recently posted items
const latestAds = [
  {
    id: 1,
    title: "iPhone 14 Pro Max - Excellent Condition",
    price: "$899",
    location: "Toronto, ON",
    timePosted: "2 HOURS AGO",
    image: "/iphone-14-pro-max.png",
    featured: true,
    rating: 4.8,
    reviewCount: 127,
  },
  {
    id: 2,
    title: "Gaming Setup - Complete Package",
    price: "$1,200",
    location: "Vancouver, BC",
    timePosted: "4 HOURS AGO",
    image: "/gaming-laptop.png",
    featured: false,
    rating: 4.6,
    reviewCount: 89,
  },
  {
    id: 3,
    title: "Modern Sofa Set - Like New",
    price: "$650",
    location: "Montreal, QC",
    timePosted: "6 HOURS AGO",
    image: "/modern-sofa.png",
    featured: true,
    rating: 4.9,
    reviewCount: 203,
  },
  {
    id: 4,
    title: "Mountain Bike - Trek 2021",
    price: "$450",
    location: "Calgary, AB",
    timePosted: "8 HOURS AGO",
    image: "/trek-mountain-bike.png",
    featured: false,
    rating: 4.7,
    reviewCount: 156,
  },
  {
    id: 5,
    title: "Vintage Leather Jacket",
    price: "$85",
    location: "Ottawa, ON",
    timePosted: "12 HOURS AGO",
    image: "/vintage-leather-jacket.png",
    featured: false,
    rating: 4.5,
    reviewCount: 94,
  },
]

export function LatestAds() {
  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Latest Ads</h2>
          <Link href="/search" className="text-primary hover:text-primary/80 font-medium">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {latestAds.map((ad) => (
            <Link key={ad.id} href={`/product/${ad.id}`}>
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 h-full flex flex-col overflow-hidden border border-gray-300 bg-white rounded-none">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={ad.image || "/placeholder.svg"}
                      alt={ad.title}
                      className="w-full h-full object-cover object-center"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 bg-white hover:bg-gray-50 shadow-sm p-1 h-6 w-6 z-10 rounded-none"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <Heart className="h-3 w-3 text-gray-600" />
                    </Button>
                    {ad.featured && (
                      <Badge className="absolute top-1 left-1 bg-yellow-500 text-black text-xs font-semibold px-1 py-0.5 uppercase tracking-wide rounded-none">
                        Featured
                      </Badge>
                    )}
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-none">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-black">{ad.price}</span>
                        <div className="flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-gray-700">{ad.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 flex flex-col flex-1 bg-white">
                    <h4 className="text-xs text-gray-800 leading-tight line-clamp-2 mb-1 font-medium">{ad.title}</h4>

                    <div className="mt-auto space-y-0.5">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">{ad.location}</span>
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">{ad.timePosted}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
