"use client"

import { useState, useEffect } from "react"
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
  Star,
  Shield,
  Clock,
  Phone,
  X,
  Copy,
  Check,
  Tag,
} from "lucide-react"
import { ContactSellerModal } from "@/components/messaging/contact-seller-modal"
import { SafetyBanner } from "@/components/ui/safety-banner"
import { SafetyWarningModal } from "@/components/ui/safety-warning-modal"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { getOptimizedImageUrl } from "@/lib/images"
import { toast } from "@/components/ui/use-toast"
import { UserRatings } from "@/components/user-ratings"

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
    rating: number
    totalReviews: number
    memberSince: string
    verified: boolean
    responseTime: string
    avatar?: string | null
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
  const [showMobileNumber, setShowMobileNumber] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showContactWarning, setShowContactWarning] = useState(false)
  const [showPhoneWarning, setShowPhoneWarning] = useState(false)
  const [pendingContactAction, setPendingContactAction] = useState<(() => void) | null>(null)

  const adDisplayId = (product.adId || product.id).slice(-6)

  const isValidUUID = (str: string) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !isValidUUID(product.id)) return
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .single()

        if (!error) setIsFavorited(!!data)
      } catch (err) {
        console.error("Error checking favorite status:", err)
      }
    }
    checkFavoriteStatus()
  }, [user, product.id])

  const toggleFavorite = async () => {
    if (!user) {
      toast({ title: "Please log in to save favorites" })
      return
    }
    if (!isValidUUID(product.id)) {
      toast({
        title: "Demo product",
        description: "Favorites are only available for real listings.",
      })
      return
    }

    try {
      const supabase = createClient()
      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id)

        if (!error) {
          setIsFavorited(false)
          toast({ title: "Removed from favorites" })
        }
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          product_id: product.id,
        })
        if (!error) {
          setIsFavorited(true)
          toast({ title: "Added to favorites" })
        }
      }
    } catch {
      toast({ title: "Failed to update favorites" })
    }
  }

  const handleReportAd = () => {
    if (!user) {
      toast({ title: "Please log in to report this ad" })
      return
    }
    if (confirm("Report this ad? Our moderation team will review.")) {
      toast({ title: "Report submitted. Thank you!" })
    }
  }

  const shareTo = (platform: "whatsapp" | "facebook" | "tiktok" | "email") => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Check out this ${product.title}`)
    let shareUrl = ""

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}%20${url}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case "tiktok":
        shareUrl = `https://www.tiktok.com/share?url=${url}&title=${text}`
        break
      case "email":
        shareUrl = `mailto:?subject=${text}&body=${text}%20${url}`
        break
    }
    window.open(shareUrl, "_blank")
    setShowShareMenu(false)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      toast({ title: "Link copied to clipboard!" })
      setTimeout(() => {
        setLinkCopied(false)
        setShowShareMenu(false)
      }, 2000)
    } catch {
      toast({ title: "Failed to copy link" })
    }
  }

  const handleViewAllAds = () => {
    window.location.href = `/seller/${product.seller.id || "unknown"}`
  }

  const handleShowMobile = () => {
    if (!user) {
      toast({ title: "Please log in to view seller's contact" })
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT SIDE */}
      <div className="lg:col-span-2">
        <SafetyBanner />

        {/* IMAGES */}
        <Card>
          <CardContent className="p-0">
            <div className="relative h-80 bg-gray-50 rounded-t-lg">
              <Image
                src={
                  getOptimizedImageUrl(product.images?.[selectedImage], "detail") ||
                  "/placeholder.svg"
                }
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-contain"
              />
              {product.images?.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage(
                        selectedImage > 0 ? selectedImage - 1 : product.images.length - 1
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth={2} fill="none" />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImage(
                        selectedImage < product.images.length - 1 ? selectedImage + 1 : 0
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={2} fill="none" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* THUMBNAILS */}
            <div className="p-3 flex space-x-2 overflow-x-auto">
              {product.images?.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? "border-primary" : "border-border"
                  }`}
                >
                  <Image
                    src={getOptimizedImageUrl(image, "thumb") || "/placeholder.svg"}
                    alt={`${product.title} thumbnail ${index + 1}`}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* INFO */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold">{product.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" /> {product.location}
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" /> {product.views} views
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 relative">
                <Button size="sm" variant="outline" onClick={toggleFavorite}>
                  <Heart
                    className={`h-4 w-4 mr-1 ${
                      isFavorited ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  {isFavorited ? "Saved" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowShareMenu(!showShareMenu)}>
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>

                {showShareMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Share this ad</span>
                        <Button size="sm" variant="ghost" onClick={() => setShowShareMenu(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Button variant="ghost" size="sm" onClick={() => shareTo("whatsapp")}>
                          WhatsApp
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => shareTo("facebook")}>
                          Facebook
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => shareTo("tiktok")}>
                          TikTok
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => shareTo("email")}>
                          Email
                        </Button>
                        <Button variant="ghost" size="sm" onClick={copyLink}>
                          {linkCopied ? <Check className="w-5 h-5 mr-3 text-green-600" /> : <Copy className="w-5 h-5 mr-3" />}
                          {linkCopied ? "Link Copied!" : "Copy Link"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AD ID */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-3 p-3 bg-muted/50 rounded-lg border">
                <div>
                  <span className="text-sm text-muted-foreground">Ad ID: </span>
                  <span className="text-lg font-bold text-primary">{adDisplayId}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(adDisplayId)
                      toast({ title: "Ad ID copied to clipboard!" })
                    } catch {
                      toast({ title: "Failed to copy Ad ID" })
                    }
                  }}
                  className="text-xs"
                >
                  Copy ID
                </Button>
              </div>
            </div>

            {/* PRICE */}
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl font-bold text-primary">{product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {product.originalPrice}
                </span>
              )}
            </div>

            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4 mr-1" />
              Posted on {new Date(product.postedDate).toLocaleDateString()}
            </div>

            {/* ACTIONS */}
            <div className="grid grid-cols-2 gap-2">
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
                  rating: product.seller.rating,
                  totalReviews: product.seller.totalReviews,
                }}
              >
                <Button
                  className="w-full bg-green-900 hover:bg-green-950"
                  onClick={() => handleContactWithWarning(() => {})}
                >
                  Chat with Seller
                </Button>
              </ContactSellerModal>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShowMobile}
              >
                <Phone className="h-4 w-4 mr-2" />
                {showMobileNumber ? product.seller.phone || "N/A" : "Show Mobile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RATINGS */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <UserRatings
              sellerId={product.seller.id}
              sellerName={product.seller.name}
              sellerAvatar={product.seller.avatar}
              productId={product.id}
              productTitle={product.title}
            />
          </CardContent>
        </Card>

        {/* DETAILS */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3">Product Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Condition:</span>
                <span className="ml-2 font-medium">{product.condition}</span>
              </div>
              {product.brand && (
                <div>
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="ml-2 font-medium">{product.brand}</span>
                </div>
              )}
              {product.model && (
                <div>
                  <span className="text-muted-foreground">Model:</span>
                  <span className="ml-2 font-medium">{product.model}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Category:</span>
                <span className="ml-2 font-medium">{product.category}</span>
              </div>
              {product.subcategory && (
                <div>
                  <span className="text-muted-foreground">Subcategory:</span>
                  <span className="ml-2 font-medium">{product.subcategory}</span>
                </div>
              )}
              {product.storage && (
                <div>
                  <span className="text-muted-foreground">Storage:</span>
                  <span className="ml-2 font-medium">{product.storage}</span>
                </div>
              )}
              {product.color && (
                <div>
                  <span className="text-muted-foreground">Color:</span>
                  <span className="ml-2 font-medium">{product.color}</span>
                </div>
              )}
            </div>

            {product.tags?.length > 0 && (
              <>
                <Separator className="my-4" />
                <h3 className="font-semibold mb-2 flex items-center">
                  <Tag className="h-4 w-4 mr-2" /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* DESCRIPTION */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3">Description</h2>
            <p className="text-sm whitespace-pre-line">{product.description}</p>
            {product.youtube_url && (
              <div className="mt-4 aspect-video">
                <iframe
                  src={product.youtube_url}
                  title="Product Video"
                  allowFullScreen
                  className="w-full h-full rounded-lg"
                />
              </div>
            )}
            {product.website_url && (
              <div className="mt-4">
                <a
                  href={product.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Visit official website
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT SIDE */}
      <div className="space-y-4">
        {/* SELLER INFO */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3">Seller Information</h2>
            <div className="flex items-center space-x-3 mb-3">
              {product.seller.avatar ? (
                <Image
                  src={product.seller.avatar}
                  alt={product.seller.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {product.seller.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
              )}
              <div>
                <div className="font-semibold">{product.seller.name}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" /> {product.seller.rating} (
                  {product.seller.totalReviews} reviews)
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 mb-3">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" /> Member since {product.seller.memberSince}
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />{" "}
                {product.seller.verified ? "Verified Seller" : "Unverified"}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" /> {product.seller.responseTime}
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleViewAllAds}>
              View All Ads
            </Button>
          </CardContent>
        </Card>

        {/* REPORT */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3">Safety & Reporting</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Help us keep the marketplace safe. Report suspicious ads.
            </p>
            <Button variant="destructive" size="sm" onClick={handleReportAd} className="w-full">
              <Flag className="h-4 w-4 mr-2" /> Report this Ad
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* WARNING MODALS */}
      <SafetyWarningModal
        open={showContactWarning}
        onOpenChange={setShowContactWarning}
        onProceed={proceedWithContact}
        type="contact"
      />
      <SafetyWarningModal
        open={showPhoneWarning}
        onOpenChange={setShowPhoneWarning}
        onProceed={proceedWithContact}
        type="phone"
      />
    </div>
  )
}
