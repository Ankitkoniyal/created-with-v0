// components/product-detail.tsx
"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  Heart,
  Share2,
  Flag,
  MapPin,
  Eye,
  Calendar,
  Shield,
  Clock,
  Phone,
  X,
  Copy,
  Check,
  Tag,
  ChevronLeft,
  ChevronRight,
  List,
  Youtube,
  Globe,
  Mail,
  User,
} from "lucide-react"
import { ContactSellerModal } from "@/components/messaging/contact-seller-modal"
import { SafetyBanner } from "@/components/ui/safety-banner"
import { SafetyWarningModal } from "@/components/ui/safety-warning-modal"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { getOptimizedImageUrl } from "@/lib/images"
import { toast } from "@/components/ui/use-toast"
import { RelatedProducts } from "@/components/related-products"
import Link from "next/link"

interface Product {
  id: string
  title: string
  price: string
  originalPrice?: string
  location: string
  images: string[]
  description: string
  youtube_url?: string | null
  website_url?: string | null
  category: string
  subcategory?: string | null
  condition: string
  brand?: string | null
  model?: string | null
  tags?: string[] | null
  postedDate: string
  views: number
  seller: {
    id: string
    name: string
    memberSince: string
    verified: boolean
    responseTime: string
    avatar?: string
    phone?: string | null
  }
  features?: string[]
  storage?: string | null
  color?: string | null
  adId?: string
  [key: string]: any
}

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { user } = useAuth()
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showMobileNumber, setShowMobileNumber] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showContactWarning, setShowContactWarning] = useState(false)
  const [showPhoneWarning, setShowPhoneWarning] = useState(false)
  const [pendingContactAction, setPendingContactAction] = useState<(() => void) | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [realAdId, setRealAdId] = useState("")
  const [reportReason, setReportReason] = useState("")
  const [customReportReason, setCustomReportReason] = useState("")
  const [viewsCount, setViewsCount] = useState(product.views || 0)

  const shareMenuRef = useRef<HTMLDivElement>(null)
  const reportReasons = [
    "Fraud or scam",
    "Inappropriate content",
    "Item already sold",
    "Wrong category",
    "Prohibited item",
    "Duplicate ad",
    "Other"
  ]

  useEffect(() => {
    const fetchAdId = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("products")
          .select("ad_id")
          .eq("id", product.id)
          .single()

        if (!error && data) {
          const adId = data.ad_id || product.id
          setRealAdId(adId.slice(-6))
        } else {
          setRealAdId(product.id.slice(-6))
        }
      } catch (error) {
        setRealAdId(product.id.slice(-6))
      }
    }

    fetchAdId()
  }, [product.id])

  useEffect(() => {
    const incrementViewCount = async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from("products")
          .update({ views: (product.views || 0) + 1 })
          .eq("id", product.id)

        if (!error) {
          setViewsCount(prev => prev + 1)
        }
      } catch (error) {
        // Silently fail for view count updates
      }
    }

    incrementViewCount()
  }, [product.id, product.views])

  const isValidUUID = useCallback((str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }, [])

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !isValidUUID(product.id)) {
        return
      }
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .single()

        if (error && error.code !== "PGRST116") {
          // Silently handle favorite status errors
        } else {
          setIsFavorited(!!data)
        }
      } catch (error) {
        // Silently handle favorite status errors
      }
    }
    checkFavoriteStatus()
  }, [user, product.id, isValidUUID])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggleFavorite = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to save ads." })
      return
    }
    if (!isValidUUID(product.id)) {
      toast({ title: "Demo product", description: "Favorites are only available for real listings." })
      return
    }
    try {
      const supabase = createClient()
      if (isFavorited) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id)
        setIsFavorited(false)
        toast({ title: "Removed from wishlist" })
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id })
        setIsFavorited(true)
        toast({ title: "Added to wishlist" })
      }
    } catch (error) {
      toast({ title: "Failed to update wishlist", variant: "destructive" })
    }
  }

  const handleReportAd = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to report this ad" })
      return
    }
    
    if (!reportReason && !customReportReason.trim()) {
      toast({ title: "Please provide a reason", description: "You need to select a reason or provide a comment for reporting this ad." })
      return
    }

    const finalReason = reportReason === "Other" ? customReportReason : reportReason;

    try {
      const supabase = createClient()
      await supabase.from("reports").insert({
        product_id: product.id,
        user_id: user.id,
        reason: finalReason,
        details: customReportReason
      })
      
      toast({ title: "Report submitted", description: "Thanks for keeping the marketplace safe." })
      
      setTimeout(() => {
        setShowReportDialog(false)
        setReportReason("")
        setCustomReportReason("")
      }, 500)

    } catch (error) {
      toast({ title: "Failed to submit report", variant: "destructive" })
    }
  }

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Check out this ${product.title} for ${product.price}`)
    const url = encodeURIComponent(window.location.href)
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank")
    setShowShareMenu(false)
  }

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank")
    setShowShareMenu(false)
  }

  const shareToTikTok = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Check out this ${product.title}`)
    window.open(`https://www.tiktok.com/share?url=${url}&title=${text}`, "_blank")
    setShowShareMenu(false)
  }

  const shareToEmail = () => {
    const subject = encodeURIComponent(`Check out this ${product.title}`)
    const body = encodeURIComponent(
      `I found this ${product.title} for ${product.price}. Check it out: ${window.location.href}`,
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
    setShowShareMenu(false)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      setTimeout(() => {
        setLinkCopied(false)
        setShowShareMenu(false)
      }, 2000)
      toast({ title: "Link copied to clipboard!" })
    } catch (error) {
      const url = window.location.href
      prompt("Copy this link:", url)
      setShowShareMenu(false)
    }
  }

  const handleShare = () => {
    setShowShareMenu(!showShareMenu)
  }

  const handleShowMobile = () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to view the seller's number." })
      return
    }
    setShowPhoneWarning(true)
    setPendingContactAction(() => () => setShowMobileNumber(true))
  }

  const handleContactWithWarning = (contactAction: () => void) => {
    setShowContactWarning(true)
    setPendingContactAction(() => contactAction)
  }

  const proceedWithContact = () => {
    if (pendingContactAction) {
      pendingContactAction()
      setPendingContactAction(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTitle = (title: string) => {
    return title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const openYouTubeVideo = () => {
    if (product.youtube_url) {
      window.open(product.youtube_url, '_blank', 'noopener,noreferrer')
    }
  }

  const openWebsiteUrl = () => {
    if (product.website_url) {
      window.open(product.website_url, '_blank', 'noopener,noreferrer')
    }
  }

  const hasYouTubeUrl = product.youtube_url && product.youtube_url.trim() !== ""
  const hasWebsiteUrl = product.website_url && product.website_url.trim() !== ""

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative h-80 md:h-96 bg-gray-50 rounded-t-lg">
              <Image
                src={getOptimizedImageUrl(product.images?.[selectedImage], "detail") || "/placeholder.svg"}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-contain"
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : product.images.length - 1)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(selectedImage < product.images.length - 1 ? selectedImage + 1 : 0)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="p-4 bg-muted/20">
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {product.images?.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                        selectedImage === index 
                          ? "border-green-900 ring-2 ring-green-700 ring-opacity-50" 
                          : "border-border hover:border-green-700"
                      }`}
                    >
                      <Image
                        src={getOptimizedImageUrl(image, "thumb") || "/placeholder.svg"}
                        alt={`${product.title} ${index + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:hidden">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-foreground mb-4">{formatTitle(product.title)}</h1>
            
            <div className="flex items-center space-x-2 mb-5">
              <span className="text-3xl font-bold text-green-900">{product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">{product.originalPrice}</span>
              )}
            </div>

            {/* Updated Location and Views Section */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{product.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{viewsCount} views</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Posted on {formatDate(product.postedDate)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span>Ad ID: </span>
                <span className="font-medium text-foreground">{realAdId}</span>
              </div>
            </div>

            <div className="flex flex-col space-y-3 mb-4">
              <ContactSellerModal
                product={{
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  image: product.images?.[0] || "/placeholder.svg",
                }}
                seller={{
                  name: product.seller.name,
                  verified: product.seller.verified,
                }}
              >
                <Button
                  className="w-full bg-green-950 hover:bg-green-800 text-white h-12"
                  onClick={() => handleContactWithWarning(() => {})}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Chat with Seller
                </Button>
              </ContactSellerModal>
              <Button
                variant="outline"
                className="w-full h-12 bg-white hover:bg-green-950 hover:text-white border-green-950 text-green-950 flex items-center justify-center"
                onClick={handleShowMobile}
              >
                <Phone className="h-4 w-4 mr-2" />
                {showMobileNumber ? product.seller.phone || "N/A" : "Show Mobile Number"}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="icon"
                variant="outline"
                onClick={toggleFavorite}
                className="w-10 h-10 rounded-full bg-white hover:bg-green-50 hover:text-green-900 border-green-700 text-green-900"
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              
              {hasYouTubeUrl && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={openYouTubeVideo}
                  className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                  title="Watch YouTube Video"
                >
                  <Youtube className="h-4 w-4" />
                </Button>
              )}
              
              {hasWebsiteUrl && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={openWebsiteUrl}
                  className="w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600"
                  title="Visit Website"
                >
                  <Globe className="h-4 w-4" />
                </Button>
              )}
              
              <div className="relative" ref={shareMenuRef}>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white hover:bg-green-50 hover:text-green-900 border-green-700 text-green-900"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                {showShareMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Share this ad</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowShareMenu(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shareToWhatsApp}
                          className="w-full justify-start text-left hover:bg-green-50 hover:text-green-900"
                        >
                          <div className="w-5 h-5 mr-3 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">W</span>
                          </div>
                          WhatsApp
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shareToFacebook}
                          className="w-full justify-start text-left hover:bg-green-50 hover:text-green-900"
                        >
                          <div className="w-5 h-5 mr-3 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">f</span>
                          </div>
                          Facebook
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shareToTikTok}
                          className="w-full justify-start text-left hover:bg-green-50 hover:text-green-900"
                        >
                          <div className="w-5 h-5 mr-3 bg-black rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          TikTok
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shareToEmail}
                          className="w-full justify-start text-left hover:bg-green-50 hover:text-green-900"
                        >
                          <div className="w-5 h-5 mr-3 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">@</span>
                          </div>
                          Email
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyLink}
                          className="w-full justify-start text-left hover:bg-green-50 hover:text-green-900"
                        >
                          {linkCopied ? (
                            <Check className="w-5 h-5 mr-3 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 mr-3" />
                          )}
                          {linkCopied ? "Link Copied!" : "Copy Link"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Description</h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Condition:</span>
                  <span className="font-medium text-foreground">{product.condition}</span>
                </div>
                {product.brand && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Brand:</span>
                    <span className="font-medium text-foreground">{product.brand}</span>
                  </div>
                )}
                {product.model && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium text-foreground">{product.model}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium text-foreground">{product.category}</span>
                </div>
              </div>
              <div className="space-y-3">
                {product.subcategory && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Subcategory:</span>
                    <span className="font-medium text-foreground">{product.subcategory}</span>
                  </div>
                )}
                {product.storage && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Storage:</span>
                    <span className="font-medium text-foreground">{product.storage}</span>
                  </div>
                )}
                {product.color && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Color:</span>
                    <span className="font-medium text-foreground">{product.color}</span>
                  </div>
                )}
              </div>
            </div>

            {product.features && product.features.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="font-semibold text-foreground mb-3">Key Features</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-900 rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {product.tags && product.tags.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="hidden lg:block">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-foreground mb-4">{formatTitle(product.title)}</h1>
            
            <div className="flex items-center space-x-2 mb-5">
              <span className="text-3xl font-bold text-green-900">{product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">{product.originalPrice}</span>
              )}
            </div>

            {/* Updated Location and Views Section */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{product.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{viewsCount} views</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Posted on {formatDate(product.postedDate)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span>Ad ID: </span>
                <span className="font-medium text-foreground">{realAdId}</span>
              </div>
            </div>

            <div className="flex flex-col space-y-3 mb-4">
              <ContactSellerModal
                product={{
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  image: product.images?.[0] || "/placeholder.svg",
                }}
                seller={{
                  name: product.seller.name,
                  verified: product.seller.verified,
                }}
              >
                <Button
                  className="w-full bg-green-950 hover:bg-green-800 text-white h-12"
                  onClick={() => handleContactWithWarning(() => {})}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Chat with Seller
                </Button>
              </ContactSellerModal>
              <Button
                variant="outline"
                className="w-full h-12 bg-white hover:bg-green-950 hover:text-white border-green-950 text-green-950 flex items-center justify-center"
                onClick={handleShowMobile}
              >
                <Phone className="h-4 w-4 mr-2" />
                {showMobileNumber ? product.seller.phone || "N/A" : "Show Mobile Number"}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="icon"
                variant="outline"
                onClick={toggleFavorite}
                className="w-10 h-10 rounded-full bg-white hover:bg-green-50 hover:text-green-900 border-green-700 text-green-900"
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              
              {hasYouTubeUrl && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={openYouTubeVideo}
                  className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                  title="Watch YouTube Video"
                >
                  <Youtube className="h-4 w-4" />
                </Button>
              )}
              
              {hasWebsiteUrl && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={openWebsiteUrl}
                  className="w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600"
                  title="Visit Website"
                >
                  <Globe className="h-4 w-4" />
                </Button>
              )}
              
              <div className="relative" ref={shareMenuRef}>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white hover:bg-green-50 hover:text-green-900 border-green-700 text-green-900"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                {showShareMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Share this ad</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowShareMenu(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shareToWhatsApp}
                          className="w-full justify-start text-left hover:bg-green-50 hover:text-green-900"
                        >
                          <div className="w-5 h-5 mr-3 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">W</span>
                          </div>
                          WhatsApp
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shareToFacebook}
                          className="w-full justify-start text-left hover:bg-green-50 hover:text-green-900"
                        >
                          <div className="w-5 h-5 mr-3 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">f</span>
                          </div>
                          Facebook
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shareToTikTok}
                          className="w-full justify-start text-left hover:bg-green-50 hover:text-green-900"
                        >
                          <div className="w-5 h-5 mr-3 bg-black rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          TikTok
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={shareToEmail}
                          className="w-full justify-start text-left hover:bg-green-50 hover:text-green-900"
                        >
                          <div className="w-5 h-5 mr-3 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">@</span>
                          </div>
                          Email
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyLink}
                          className="w-full justify-start text-left hover:bg-green-50 hover:text-green-900"
                        >
                          {linkCopied ? (
                            <Check className="w-5 h-5 mr-3 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 mr-3" />
                          )}
                          {linkCopied ? "Link Copied!" : "Copy Link"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Updated Seller Information Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 text-lg">Seller Information</h3>
            <Link
              href={`/seller/${product.seller.id}`}
              className="flex items-center space-x-4 mb-4"
            >
              {(() => {
                const name = product.seller.name || 'User'
                const fallback = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundType=gradientLinear`
                const src = product.seller.avatar || fallback
                return (
                  <Image
                    src={src}
                    alt={name}
                    width={56}
                    height={56}
                    className="rounded-full object-cover bg-gray-100"
                  />
                )
              })()}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-foreground text-base hover:text-green-900 hover:underline">
                    {product.seller.name}
                  </span>
                </div>
              </div>
            </Link>
            
            <div className="space-y-3 text-sm mb-5">
              {product.seller.verified && (
                <div className="flex items-center p-3 bg-green-50 rounded-md border border-green-200">
                  <Mail className="h-4 w-4 mr-3 text-green-600" />
                  <div>
                    <div className="font-medium text-green-800">Email Verified</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center p-3 bg-muted/30 rounded-md">
                <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">Member since</div>
                  <div className="text-muted-foreground">{product.seller.memberSince}</div>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-muted/30 rounded-md">
                <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">Response time</div>
                  <div className="text-muted-foreground">{product.seller.responseTime}</div>
                </div>
              </div>
              
              <Link 
                href={`/seller/${product.seller.id}`} 
                className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-md border border-green-200 transition-colors"
              >
                <List className="h-4 w-4 mr-3 text-green-700" />
                <div>
                  <div className="font-medium text-green-900">See all ads from this Seller</div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <SafetyBanner />
            <div className="flex items-center justify-center mt-4">
              <Button
                variant="ghost"
                onClick={() => setShowReportDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center"
              >
                <Flag className="h-4 w-4 mr-2" />
                Report this Ad
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    
      {showReportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Report this Ad</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please select a reason for reporting this ad. This helps us keep our marketplace safe.
            </p>
            
            <div className="space-y-2 mb-4">
              {reportReasons.map((reason) => (
                <div key={reason} className="flex items-center">
                  <input
                    type="radio"
                    id={reason}
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="mr-2"
                  />
                  <label htmlFor={reason} className="text-sm">{reason}</label>
                </div>
              ))}
            </div>
            
            <div className="mb-4">
              <label htmlFor="customReason" className="block text-sm font-medium mb-2">
                Comments
              </label>
              <textarea
                id="customReason"
                value={customReportReason}
                onChange={(e) => setCustomReportReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={3}
                placeholder="Please describe the issue..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReportDialog(false)
                  setReportReason("")
                  setCustomReportReason("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReportAd}
                className="bg-red-600 hover:bg-red-700"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <SafetyWarningModal
        isOpen={showContactWarning}
        onClose={() => {
          setShowContactWarning(false)
          setPendingContactAction(null)
        }}
        onProceed={proceedWithContact}
        type="contact"
      />
      <SafetyWarningModal
        isOpen={showPhoneWarning}
        onClose={() => {
          setShowPhoneWarning(false)
          setPendingContactAction(null)
        }}
        onProceed={proceedWithContact}
        type="phone"
      />
    </div>
  )
}
