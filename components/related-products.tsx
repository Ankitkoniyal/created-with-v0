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

        // Get current product with subcategory info
        const { data: currentProduct, error: currentError } = await supabase
          .from("products")
          .select(`
            id,
            category,
            subcategory_id,
            title,
            brand,
            tags,
            condition
          `)
          .eq("id", currentProductId)
          .single()

        if (currentError || !currentProduct) {
          console.error("Error fetching current product:", currentError)
          // Fallback to simple category matching
          const { data: fallbackData } = await supabase
            .from("products")
            .select("id, title, price, images")
            .eq("category", category)
            .neq("id", currentProductId)
            .limit(8)
          
          setProducts(fallbackData || [])
          setLoading(false)
          return
        }

        console.log("Current product:", {
          title: currentProduct.title,
          category: currentProduct.category,
          subcategory_id: currentProduct.subcategory_id
        })

        // Extract keywords from title
        const titleKeywords = currentProduct.title
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2)
          .filter(word => !['for', 'and', 'the', 'with', 'new', 'used', 'sale'].includes(word))
          .slice(0, 5)

        console.log("Extracted keywords:", titleKeywords)

        // Build query with priority-based matching
        let query = supabase
          .from("products")
          .select("id, title, price, images, subcategory_id")
          .neq("id", currentProductId)

        // PRIORITY 1: Same subcategory (most important!)
        if (currentProduct.subcategory_id) {
          console.log("Filtering by same subcategory_id:", currentProduct.subcategory_id)
          query = query.eq("subcategory_id", currentProduct.subcategory_id)
        }
        
        // Always filter by same category
        query = query.eq("category", currentProduct.category)

        // PRIORITY 2: Keyword matching in title
        if (titleKeywords.length > 0) {
          const keywordConditions = titleKeywords.map(keyword => 
            `title.ilike.%${keyword}%`
          ).join(',')
          console.log("Adding keyword matching:", keywordConditions)
          query = query.or(keywordConditions)
        }

        // PRIORITY 3: Brand matching
        if (currentProduct.brand) {
          query = query.ilike("brand", `%${currentProduct.brand}%`)
        }

        const { data, error } = await query.limit(8)

        if (error) {
          console.error("Error with intelligent query:", error)
        }

        // If we have enough results with subcategory matching, use them
        if (data && data.length >= 4) {
          console.log("Found sufficient related products with subcategory matching:", data.length)
          setProducts(data)
        } else {
          // Fallback: Expand search to same category but different subcategories
          console.log("Need more products, expanding search...")
          
          let fallbackQuery = supabase
            .from("products")
            .select("id, title, price, images")
            .eq("category", currentProduct.category)
            .neq("id", currentProductId)

          // If we have some data but not enough, combine results
          if (data && data.length > 0) {
            const existingIds = data.map(p => p.id)
            fallbackQuery = fallbackQuery.not('id', 'in', `(${existingIds.join(',')})`)
            
            const { data: fallbackData } = await fallbackQuery.limit(8 - data.length)
            const combinedProducts = [...data, ...(fallbackData || [])]
            setProducts(combinedProducts.slice(0, 8))
          } else {
            // No results from intelligent query, use simple category matching
            const { data: fallbackData } = await fallbackQuery.limit(8)
            setProducts(fallbackData || [])
          }
        }

      } catch (error) {
        console.error("Error in fetchRelatedProducts:", error)
        // Final fallback
        const supabase = await getSupabaseClient()
        if (supabase) {
          const { data: fallbackData } = await supabase
            .from("products")
            .select("id, title, price, images")
            .eq("category", category)
            .neq("id", currentProductId)
            .limit(8)
          
          setProducts(fallbackData || [])
        }
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
