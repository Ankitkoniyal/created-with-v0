// components/related-products.tsx
"use client"

import { useState, useEffect } from 'react'
import { ProductGrid } from './product-grid'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

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
      logger.debug('Fetching current product', { currentProductId })
      
      const supabase = createClient()
      
      try {
        // First get the current product to ensure we have correct data
        const { data: currentProduct, error: currentError } = await supabase
          .from('products')
          .select('id, category, subcategory, title')
          .eq('id', currentProductId)
          .single()

        if (currentError) {
          logger.error('Error fetching current product', { error: currentError, currentProductId })
          return
        }

        logger.debug('Current product found', { product: currentProduct })

        // Build query for related products
        let query = supabase
          .from('products')
          .select('*')
          .neq('id', currentProductId)
          .eq('status', 'active')
          .limit(4)

        // Prioritize same subcategory, then same category
        if (currentProduct.subcategory) {
          logger.debug('Filtering by subcategory slug', { subcategory: currentProduct.subcategory })
          query = query.eq('subcategory', currentProduct.subcategory)
        } else {
          logger.debug('Filtering by category', { category: currentProduct.category })
          query = query.eq('category', currentProduct.category)
        }

        const { data: products, error } = await query

        if (error) {
          logger.error('Error fetching related products', { error })
          return
        }

        logger.debug('Found related products', { count: products?.length || 0 })

        // If no products found in same subcategory/category, get any products from same category
        if (!products || products.length === 0) {
          logger.debug('No related products found, fetching from same category')
          const { data: fallbackProducts, error: fallbackError } = await supabase
            .from('products')
            .select('*')
            .neq('id', currentProductId)
            .eq('category', currentProduct.category)
            .eq('status', 'active')
            .limit(4)

          if (!fallbackError) {
            setRelatedProducts(fallbackProducts || [])
          }
        } else {
          setRelatedProducts(products)
        }

      } catch (error) {
        logger.error('Unexpected error in fetchRelatedProducts', { error })
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
      <ProductGrid products={relatedProducts} showPagination={false} />
    </div>
  )
}
