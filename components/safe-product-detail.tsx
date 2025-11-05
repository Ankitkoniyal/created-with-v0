// components/safe-product-detail.tsx
"use client"

import { ProductDetail } from "@/components/product-detail"

// Safe link component for external URLs
function SafeLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="nofollow noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  )
}

export function SafeProductDetail({ product }: { product: any }) {
  // Debug what's actually received
  console.log('🔍 SafeProductDetail received:', product)
  
  if (!product || typeof product !== 'object') {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Product Loading Failed</h2>
        <p className="text-red-700">We couldn't load the product details. Please try again.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Ensure all required fields have values
  const safeProduct = {
    id: product.id || 'unknown',
    title: product.title || 'Untitled Product',
    price: product.price || 'Price not available',
    location: product.location || 'Location not specified',
    images: Array.isArray(product.images) ? product.images : ['/placeholder.svg'],
    description: product.description || 'No description available',
    category: product.category || 'Other',
    condition: product.condition || 'Not specified',
    youtube_url: product.youtube_url || null,
    website_url: product.website_url || null,
    seller: product.seller || {
      id: 'unknown',
      name: 'Seller',
      rating: 0,
      totalReviews: 0,
      memberSince: '2024',
      verified: false,
      responseTime: 'Usually responds within 24 hours',
      phone: null
    },
    // Add all other properties with safe defaults
    ...product
  }

  return (
    <div>
      <ProductDetail product={safeProduct} />
    </div>
  )
}
