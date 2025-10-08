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
  subcategory_id?: string
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

        console.log("Fetching current product:", currentProductId)

        // Get current product with better error handling
        const { data: currentProduct, error: currentError } = await supabase
          .from("products")
          .select(`
            id,
            category,
            subcategory_id,
            subcategory,
            title,
            brand
          `)
          .eq("id", currentProductId)
          .single()

        // Better error handling
        if (currentError) {
          console.error("Error fetching current product:", {
            message: currentError.message,
            details: currentError.details,
            code: currentError.code
          })
          setProducts([])
          setLoading(false)
          return
        }

        if (!currentProduct) {
          console.error("Current product not found with ID:", currentProductId)
          setProducts([])
          setLoading(false)
          return
        }

        console.log("Current product found:", {
          id: currentProduct.id,
          title: currentProduct.title,
          category: currentProduct.category,
          subcategory: currentProduct.subcategory,
          subcategory_id: currentProduct.subcategory_id
        })

        // If no subcategory info, don't show related products
        if (!currentProduct.subcategory && !currentProduct.subcategory_id) {
          console.log("No subcategory information available, skipping related products")
          setProducts([])
          setLoading(false)
          return
        }

        // Build query for same subcategory products
        let query = supabase
          .from("products")
          .select("id, title, price, images, subcategory_id, subcategory")
          .eq("category", currentProduct.category)
          .neq("id", currentProductId)
          .eq("status", "active") // Only show active products

        // Filter by subcategory (priority to slug, then ID)
        if (currentProduct.subcategory) {
          console.log("Filtering by subcategory slug:", currentProduct.subcategory)
          query = query.eq("subcategory", currentProduct.subcategory)
        } else if (currentProduct.subcategory_id) {
          console.log("Filtering by subcategory ID:", currentProduct.subcategory_id)
          query = query.eq("subcategory_id", currentProduct.subcategory_id)
        }

        const { data, error } = await query.limit(8)

        if (error) {
          console.error("Error fetching related products:", error)
          setProducts([])
          return
        }

        console.log(`Found ${data?.length || 0} related products`)
        setProducts(data || [])

      } catch (error) {
        console.error("Unexpected error in fetchRelatedProducts:", error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have a valid product ID
    if (currentProductId && currentProductId !== "undefined") {
      fetchRelatedProducts()
    } else {
      setLoading(false)
      setProducts([])
    }
  }, [category, currentProductId])

  // Loading state
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

  // Don't show anything if no related products found
  if (products.length === 0) {
    return null
  }

  // Render related products
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
                src={product.images?.[0] || "/placeholder-product.jpg"}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.title}</h3>
              <p className="text-lg font-bold text-green-700">${product.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
