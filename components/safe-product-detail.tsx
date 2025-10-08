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
    // Add all other properties with safe defaults
    ...product
  }

  return (
    <div>
      <ProductDetail product={safeProduct} />
      
      {/* Render safe external links if they exist */}
      {(safeProduct.youtube_url || safeProduct.website_url) && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-semibold text-lg mb-3">External Links</h3>
          <div className="space-y-2">
            {safeProduct.youtube_url && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-3">YouTube:</span>
                <SafeLink 
                  href={safeProduct.youtube_url}
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Watch Video
                </SafeLink>
              </div>
            )}
            {safeProduct.website_url && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-3">Website:</span>
                <SafeLink 
                  href={safeProduct.website_url}
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Visit Website
                </SafeLink>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            External links open in new window and are marked as no-follow for SEO.
          </p>
        </div>
      )}
    </div>
  )
}
