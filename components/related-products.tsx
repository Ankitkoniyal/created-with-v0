"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface RelatedProduct {
  id: string
  title: string
  price: string
  images: string[]
}

interface RelatedProductsProps {
  currentProductId: string
  category: string
}

export function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setIsLoading(true)
      const supabase = createClient()
      
      try {
        const { data, error } = await supabase
          .from("products") 
          .select("id, title, price, images")
          .eq("category", category)
          .neq("id", currentProductId)
<<<<<<< HEAD
          .limit(8) // fetch more since we show 4 per row
=======
          .limit(8)
>>>>>>> d69efb21dcb75af0a3ea3592a875add2b5eb3bb1

        if (error) {
          console.error("Error fetching related products:", error)
          setRelatedProducts([])
        } else {
          setRelatedProducts(data || [])
        }
      } catch (e) {
        console.error("An error occurred during fetch:", e)
        setRelatedProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [category, currentProductId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 text-gray-500">
        Loading related ads...
      </div>
    )
  }

  if (relatedProducts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No related products found in this category.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Related Ads</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {relatedProducts.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} passHref>
            <Card className="group overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
              {/* Square Image */}
              <div className="relative w-full aspect-square">
                <Image
<<<<<<< HEAD
                  src={product.images[0] || "/placeholder.svg"}
=======
                  src={product.images?.[0] || "/placeholder.svg"}
>>>>>>> d69efb21dcb75af0a3ea3592a875add2b5eb3bb1
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <CardContent className="p-3">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {product.title}
                </h3>
                <p className="text-base font-bold text-green-700 mt-1">
                  ${Number(product.price).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
