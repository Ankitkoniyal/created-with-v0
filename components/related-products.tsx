// File: components/related-products.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/supabase/client"

interface RelatedProduct {
  id: string
  title: string
  price: number
  images: string[]
}

interface RelatedProductsProps {
  category: string
  currentProductId: string
}

export function RelatedProducts({ category, currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelatedProducts() {
      try {
        const supabase = await getSupabaseClient()
        if (!supabase) {
          console.error("Supabase client not available")
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("products")
          .select("id, title, price, images")
          .eq("category", category)
          .neq("id", currentProductId)
          .limit(8) // fetch 8 products to show 2 rows of 4

          .limit(8) // fetch more since we show 4 per row


        if (error) {
          console.error("Error fetching related products:", error)
        } else {
          setProducts(data || [])
        }
      } catch (error) {
        console.error("Error in fetchRelatedProducts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [category, currentProductId])

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded mt-2"></div>
              <div className="h-4 bg-gray-200 rounded mt-1 w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (

    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group block overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={product.images[0] || "/placeholder-product.jpg"}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
              <p className="text-lg font-bold mt-1">${product.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}