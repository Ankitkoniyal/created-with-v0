// components/safe-product-detail.tsx
"use client"

import { ProductDetail } from "@/components/product-detail"

export function SafeProductDetail({ product }: { product: any }) {

  if (!product || typeof product !== "object") {
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

  const safeSeller = (() => {
    const defaultSeller = {
      id: "unknown",
      name: "Seller",
      rating: 0,
      totalReviews: 0,
      memberSince: "2024",
      verified: false,
      responseTime: "Usually responds within 24 hours",
      phone: null,
      avatar: null,
    }

    if (product.seller && typeof product.seller === "object") {
      return {
        ...defaultSeller,
        ...product.seller,
        id: product.seller.id || defaultSeller.id,
        name: product.seller.name || defaultSeller.name,
        memberSince: product.seller.memberSince || defaultSeller.memberSince,
        responseTime: product.seller.responseTime || defaultSeller.responseTime,
      }
    }

    return defaultSeller
  })()

  // Ensure all required fields have values
  const safeProduct = {
    id: product.id || "unknown",
    title: product.title || "Untitled Product",
    price: product.price || "Price not available",
    location: product.location || "Location not specified",
    images: Array.isArray(product.images) && product.images.length > 0 ? product.images : ["/placeholder.svg"],
    description: product.description || "No description available",
    category: product.category || "Other",
    condition: product.condition || "Not specified",
    youtube_url: product.youtube_url || null,
    website_url: product.website_url || null,
    seller: safeSeller,
    // Preserve any other properties that may exist
    ...product,
  }

  return (
    <div>
      <ProductDetail product={safeProduct} />

      {/* External Links section removed - links are still accessible via icon buttons */}
    </div>
  )
}
