"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Heart, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mock related products data
const relatedProducts = [
  {
    id: "3",
    title: "iPhone 13 Pro - Great Condition",
    price: "$699",
    location: "Brooklyn, NY",
    image: "/iphone-13-pro.png",
    category: "Electronics",
  },
  {
    id: "4",
    title: "Samsung Galaxy S23 Ultra",
    price: "$799",
    location: "Manhattan, NY",
    image: "/samsung-galaxy-s23-ultra.png",
    category: "Electronics",
  },
  {
    id: "5",
    title: "iPad Air 5th Generation",
    price: "$449",
    location: "Queens, NY",
    image: "/ipad-air-5th-gen.png",
    category: "Electronics",
  },
  {
    id: "6",
    title: "2020 Toyota Camry - Excellent",
    price: "$22,500",
    location: "Pasadena, CA",
    image: "/2020-toyota-camry.png",
    category: "Cars",
  },
]

interface RelatedProductsProps {
  currentProductId: string
  category: string
}

export function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const filteredProducts = relatedProducts
    .filter((product) => product.id !== currentProductId && product.category === category)
    .slice(0, 3)

  if (filteredProducts.length === 0) {
    return null
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-foreground mb-6">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <Card className="group cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-foreground mb-2 line-clamp-2">{product.title}</h4>
                  <p className="text-2xl font-bold text-primary mb-2">{product.price}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {product.location}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
