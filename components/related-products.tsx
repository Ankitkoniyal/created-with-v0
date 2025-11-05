// components/related-products.tsx
"use client"

import { useState, useEffect } from 'react'
import { ProductGrid } from './product-grid'
import { createClient } from '@/lib/supabase/client'

interface RelatedProductsProps {
  currentProductId: string
  category: string
  subcategory?: string | null
}

export function RelatedProducts({ currentProductId, category, subcategory }: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelatedProducts() {
      console.log('Fetching current product:', currentProductId)
      
      const supabase = createClient()
      
      try {
        // First get the current product to ensure we have correct data
        const { data: currentProduct, error: currentError } = await supabase
          .from('products')
          .select('id, category, subcategory, title')
          .eq('id', currentProductId)
          .single()

        if (currentError) {
          console.error('Error fetching current product:', currentError)
          return
        }

        console.log('Current product found:', currentProduct)

        // Build query for related products
        let query = supabase
          .from('products')
          .select('*')
          .neq('id', currentProductId)
          .eq('status', 'active')
          .limit(8)

        // Prioritize same subcategory, then same category
        if (currentProduct.subcategory) {
          console.log('Filtering by subcategory slug:', currentProduct.subcategory)
          query = query.eq('subcategory', currentProduct.subcategory)
        } else {
          console.log('Filtering by category:', currentProduct.category)
          query = query.eq('category', currentProduct.category)
        }

        const { data: products, error } = await query

        if (error) {
          console.error('Error fetching related products:', error)
          return
        }

        console.log('Found', products?.length || 0, 'related products')

        // If no products found in same subcategory/category, get any products from same category
        if (!products || products.length === 0) {
          console.log('No related products found, fetching from same category')
          const { data: fallbackProducts, error: fallbackError } = await supabase
            .from('products')
            .select('*')
            .neq('id', currentProductId)
            .eq('category', currentProduct.category)
            .eq('status', 'active')
            .limit(8)

          if (!fallbackError) {
            setRelatedProducts(fallbackProducts || [])
          }
        } else {
          setRelatedProducts(products)
        }

      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [currentProductId, category, subcategory])

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (relatedProducts.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <ProductGrid products={relatedProducts} />
    </div>
  )
}
