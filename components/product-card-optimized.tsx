// Optimized Product Card Component with React.memo
"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Share2, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getOptimizedImageUrl } from "@/lib/images"
import { formatLocation } from "@/lib/location-utils"
import { useLanguage } from "@/hooks/use-language"
import { toast } from "sonner"

interface ProductCardProps {
  product: {
    id: string
    title: string
    price: number
    price_type?: string
    images?: string[]
    city: string
    province: string
    created_at: string
    user_id: string
  }
  isFavorite: boolean
  onToggleFavorite: (productId: string, e?: React.MouseEvent) => void
  formatPrice: (price?: number, priceType?: string) => string
  isNegotiable: (priceType?: string) => boolean
  formatTimePosted: (createdAt?: string) => string
}

const ProductCard = React.memo<ProductCardProps>(({
  product,
  isFavorite,
  onToggleFavorite,
  formatPrice,
  isNegotiable,
  formatTimePosted,
}) => {
  const { t, language } = useLanguage()
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [hasNativeShare, setHasNativeShare] = useState(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)
  const primaryImage = product.images?.[0] || "/diverse-products-still-life.png"
  const optimizedPrimary = getOptimizedImageUrl(primaryImage, "thumb") || primaryImage

  const productUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/product/${product.id}`
    : `/product/${product.id}`

  // Check if native share is available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setHasNativeShare(true)
    }
  }, [])

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false)
      }
    }

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showShareMenu])

  const shareToWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const text = encodeURIComponent(`Check out this ${product.title} for ${formatPrice(product.price, product.price_type)}`)
    const url = encodeURIComponent(productUrl)
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank")
    setShowShareMenu(false)
  }

  const shareToFacebook = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = encodeURIComponent(productUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank")
    setShowShareMenu(false)
  }

  const shareToTwitter = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const text = encodeURIComponent(`Check out this ${product.title} for ${formatPrice(product.price, product.price_type)}`)
    const url = encodeURIComponent(productUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank")
    setShowShareMenu(false)
  }

  const shareToTikTok = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = encodeURIComponent(productUrl)
    const text = encodeURIComponent(`Check out this ${product.title}`)
    window.open(`https://www.tiktok.com/share?url=${url}&title=${text}`, "_blank")
    setShowShareMenu(false)
  }

  const shareToEmail = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const subject = encodeURIComponent(`Check out this ${product.title}`)
    const body = encodeURIComponent(
      `I found this ${product.title} for ${formatPrice(product.price, product.price_type)}. Check it out: ${productUrl}`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
    setShowShareMenu(false)
  }

  const shareNative = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out this ${product.title} for ${formatPrice(product.price, product.price_type)}`,
          url: productUrl,
        })
        setShowShareMenu(false)
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      // Fallback to copy link if native share not available
      copyLink(e)
    }
  }

  const copyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(productUrl)
      setLinkCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => {
        setLinkCopied(false)
        setShowShareMenu(false)
      }, 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = productUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success("Link copied to clipboard!")
      setShowShareMenu(false)
    }
  }

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowShareMenu(!showShareMenu)
  }

  return (
    <Link href={`/product/${product.id}`} className="block" prefetch={false}>
      <Card className="h-full flex flex-col overflow-visible border border-gray-200 bg-white rounded-sm hover:shadow-md transition-shadow">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
            <Image
              src={optimizedPrimary || "/placeholder.svg"}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw"
              className="object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg"
              }}
            />
            
            {/* Share Button - Top Left */}
            <div className="absolute top-1 left-1 z-10" ref={shareMenuRef}>
              <button
                onClick={handleShareClick}
                className="p-1 rounded text-gray-400 bg-white/80 hover:bg-white/95 hover:text-green-600 transition-colors"
                aria-label="Share this product"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              
              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <div className="absolute top-8 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] max-h-[400px] overflow-y-auto z-20">
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                    <span className="text-xs font-medium text-gray-700">Share</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowShareMenu(false)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {/* Native Share (Mobile) */}
                  {hasNativeShare && (
                    <button
                      onClick={shareNative}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 transition-colors"
                    >
                      <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
                        <Share2 className="h-2.5 w-2.5 text-white" />
                      </div>
                      Share...
                    </button>
                  )}

                  <button
                    onClick={shareToWhatsApp}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-green-50 hover:text-green-900 flex items-center gap-2 transition-colors"
                  >
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">W</span>
                    </div>
                    WhatsApp
                  </button>
                  
                  <button
                    onClick={shareToFacebook}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2 transition-colors"
                  >
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">f</span>
                    </div>
                    Facebook
                  </button>
                  
                  <button
                    onClick={shareToTwitter}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-sky-50 hover:text-sky-900 flex items-center gap-2 transition-colors"
                  >
                    <div className="w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">𝕏</span>
                    </div>
                    Twitter/X
                  </button>
                  
                  <button
                    onClick={shareToTikTok}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-black hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">T</span>
                    </div>
                    TikTok
                  </button>
                  
                  <button
                    onClick={shareToEmail}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px]">✉</span>
                    </div>
                    Email
                  </button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={copyLink}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 transition-colors"
                  >
                    <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">🔗</span>
                    </div>
                    {linkCopied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              )}
            </div>

            {/* Favorite Button - Top Right */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleFavorite(product.id, e)
              }}
              className={`absolute top-1 right-1 p-1 rounded z-10 ${
                isFavorite 
                  ? "text-red-500 bg-white/90" 
                  : "text-gray-400 bg-white/80"
              } hover:bg-white/95 transition-colors`}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart 
                className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`}
              />
            </button>
          </div>

          <div className="px-2 py-1 flex flex-col flex-1 min-h-0">
            <div className="mb-1">
              <span className="text-base font-bold text-green-700">
                {formatPrice(product.price, product.price_type)}
                {isNegotiable(product.price_type) && (
                  <span className="text-xs font-normal text-gray-600 ml-1">{language === "fr" ? "Négociable" : "Negotiable"}</span>
                )}
              </span>
            </div>
              
            <h4 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1 leading-tight truncate min-h-[1.25rem]">
              {product.title}
            </h4>

            <div className="mt-auto flex items-center justify-between text-xs text-gray-500 gap-2 min-h-[1rem]">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="truncate"> 
                  {formatLocation(product.city, product.province)}
                </span>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap"> 
                <span>{formatTimePosted(product.created_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})

ProductCard.displayName = "ProductCard"

// Export with language dependency to ensure re-renders
export { ProductCard }

