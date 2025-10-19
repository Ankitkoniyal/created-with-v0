// components/product-grid.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Product {
  id: string
  title: string
  price: number
  location: string
  city: string
  province: string
  images: string[]
  created_at: string
}

const mockProducts: Product[] = [
  {
    id: "1",
    title: "iPhone 13 Pro Max 256GB",
    price: 999,
    location: "Toronto, ON",
    city: "Toronto",
    province: "ON",
    images: [],
    created_at: new Date().toISOString()
  },
  {
    id: "2",
    title: "MacBook Pro 2023 M2",
    price: 1899,
    location: "Vancouver, BC",
    city: "Vancouver",
    province: "BC",
    images: [],
    created_at: new Date().toISOString()
  },
  {
    id: "3",
    title: "Samsung Galaxy S23 Ultra",
    price: 1199,
    location: "Montreal, QC",
    city: "Montreal",
    province: "QC",
    images: [],
    created_at: new Date().toISOString()
  },
  {
    id: "4",
    title: "Canon EOS R5 Camera",
    price: 3899,
    location: "Calgary, AB",
    city: "Calgary",
    province: "AB",
    images: [],
    created_at: new Date().toISOString()
  },
  {
    id: "5",
    title: "PlayStation 5 Console",
    price: 649,
    location: "Ottawa, ON",
    city: "Ottawa",
    province: "ON",
    images: [],
    created_at: new Date().toISOString()
  },
  {
    id: "6",
    title: "Nikon Z7 II Mirrorless",
    price: 2999,
    location: "Edmonton, AB",
    city: "Edmonton",
    province: "AB",
    images: [],
    created_at: new Date().toISOString()
  },
  {
    id: "7",
    title: "iPad Air 5th Generation",
    price: 749,
    location: "Winnipeg, MB",
    city: "Winnipeg",
    province: "MB",
    images: [],
    created_at: new Date().toISOString()
  },
  {
    id: "8",
    title: "DJI Mavic 3 Drone",
    price: 2199,
    location: "Quebec City, QC",
    city: "Quebec City",
    province: "QC",
    images: [],
    created_at: new Date().toISOString()
  }
]

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts(mockProducts)
      setLoading(false)
    }, 1000)
  }, [])

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`
  }

  const formatTimePosted = (createdAt: string) => {
    const now = new Date()
    const posted = new Date(createdAt)
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 48) return "1d"
    return `${Math.floor(diffInHours / 24)}d`
  }

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="border rounded-lg overflow-hidden bg-white animate-pulse">
                <div className="bg-gray-200 h-48 w-full"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="block">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow h-full">
                <div className="bg-gray-100 h-48 w-full flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Product Image</span>
                </div>
                <div className="p-4">
                  <div className="text-lg font-bold text-green-700 mb-2">
                    {formatPrice(product.price)}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                  </h4>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span className="truncate">
                      {product.city}, {product.province}
                    </span>
                    <span>{formatTimePosted(product.created_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
