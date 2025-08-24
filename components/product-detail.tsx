"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Heart, Share2, Flag, MapPin, Eye, Calendar, Star, Shield, Clock, Phone, X, Copy, Check } from "lucide-react"
import { ContactSellerModal } from "@/components/messaging/contact-seller-modal"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface Product {
  id: string
  title: string
  price: string
  originalPrice?: string
  location: string
  images: string[]
  description: string
  youtubeUrl?: string | null
  websiteUrl?: string | null
  category: string
  subcategory?: string | null
  condition: string
  brand: string
  model: string
  postedDate: string
  views: number
  adId: string
  seller: {
    name: string
    rating: number
    totalReviews: number
    memberSince: string
    verified: boolean
    responseTime: string
  }
  features: string[]
  storage?: string | null
  color?: string | null
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

  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !isValidUUID(product.id)) {
        console.log("[v0] Skipping favorite check - invalid UUID or no user:", product.id)
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
          console.error("Error checking favorite status:", error)
        } else {
          setIsFavorited(!!data)
        }
      } catch (error) {
        console.error("Error checking favorite status:", error)
      }
    }

    checkFavoriteStatus()
  }, [user, product.id])

  const toggleFavorite = async () => {
    if (!user) {
      alert("Please log in to save favorites")
      return
    }

    if (!isValidUUID(product.id)) {
      alert("This is a demo product. Favorites are only available for real listings.")
      return
    }

    try {
      const supabase = createClient()

      if (isFavorited) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id)

        if (error) {
          console.error("Error removing favorite:", error)
          alert("Failed to remove from favorites")
        } else {
          console.log("[v0] Removed from favorites:", product.id)
          setIsFavorited(false)
        }
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          product_id: product.id,
        })

        if (error) {
          console.error("Error adding favorite:", error)
          alert("Failed to add to favorites")
        } else {
          console.log("[v0] Added to favorites:", product.id)
          setIsFavorited(true)
        }
      }
    } catch (error) {
      console.error("Error adding favorite:", error)
      alert("Failed to update favorites")
    }
  }

  const handleReportAd = () => {
    if (!user) {
      alert("Please log in to report this ad")
      return
    }

    const confirmed = window.confirm(
      "Are you sure you want to report this ad? This will notify our moderation team for review.",
    )

    if (confirmed) {
      console.log("[v0] Reporting ad:", product.id)
      alert("Thank you for your report. Our team will review this ad shortly.")
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
    } catch (error) {
      console.error("Failed to copy link:", error)
      const url = window.location.href
      prompt("Copy this link:", url)
      setShowShareMenu(false)
    }
  }

  const handleShare = () => {
    setShowShareMenu(!showShareMenu)
  }

  const formatAdId = (adId: string) => {
    return adId
  }

  const handleViewAllAds = () => {
    window.location.href = `/seller/${product.seller.name.toLowerCase().replace(/\s+/g, "-")}/ads`
  }

  const handleShowMobile = () => {
    if (!user) {
      alert("Please log in to view seller's contact information")
      return
    }
    setShowMobileNumber(true)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={product.images[selectedImage] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-80 object-cover rounded-t-lg"
              />
            </div>

            <div className="p-3">
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? "border-primary" : "border-border"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold text-foreground mb-1">{product.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {product.location}
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {product.views} views
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 relative">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleFavorite}
                  className="text-primary hover:bg-green-100 hover:text-green-700 border-primary/20 bg-transparent"
                >
                  <Heart className={`h-4 w-4 mr-1 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                  {isFavorited ? "Saved" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShare}
                  className="text-primary hover:bg-green-100 hover:text-green-700 border-primary/20 bg-transparent"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
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
                          className="w-full justify-start text-left hover:bg-green-100 hover:text-green-700"
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
                          className="w-full justify-start text-left hover:bg-green-100 hover:text-green-700"
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
                          className="w-full justify-start text-left hover:bg-green-100 hover:text-green-700"
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
                          className="w-full justify-start text-left hover:bg-green-100 hover:text-green-700"
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
                          className="w-full justify-start text-left hover:bg-green-100 hover:text-green-700"
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

            <div className="mb-2">
              <span className="text-sm text-muted-foreground">Ad ID: </span>
              <span className="text-sm font-medium text-primary">{formatAdId(product.adId)}</span>
            </div>

            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl font-bold text-primary">{product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">{product.originalPrice}</span>
              )}
            </div>

            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4 mr-1" />
              Posted on {new Date(product.postedDate).toLocaleDateString()}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ContactSellerModal
                product={{
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  image: product.images[0],
                }}
                seller={{
                  name: product.seller.name,
                  verified: product.seller.verified,
                  rating: product.seller.rating,
                  totalReviews: product.seller.totalReviews,
                }}
              >
                <Button className="w-full bg-primary hover:bg-green-600">Chat with Seller</Button>
              </ContactSellerModal>
              <Button
                variant="outline"
                className="w-full bg-transparent hover:bg-green-100 hover:text-green-700 flex items-center justify-center"
                onClick={handleShowMobile}
              >
                <Phone className="h-4 w-4 mr-2" />
                {showMobileNumber ? "+1 (555) 123-****" : "Show Mobile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold text-foreground mb-3">Product Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Condition:</span>
                <span className="ml-2 font-medium">{product.condition}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Brand:</span>
                <span className="ml-2 font-medium">{product.brand}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span>
                <span className="ml-2 font-medium">{product.model}</span>
              </div>
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

            <Separator className="my-4" />

            <h3 className="font-semibold text-foreground mb-2">Key Features</h3>
            <ul className="space-y-1">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                onClick={handleReportAd}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center"
              >
                <Flag className="h-4 w-4 mr-2" />
                Report this Ad
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Seller Information</h3>

            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {product.seller.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{product.seller.name}</span>
                  {product.seller.verified && <Shield className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{product.seller.rating}</span>
                  <span>({product.seller.totalReviews} reviews)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Member since {product.seller.memberSince}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{product.seller.responseTime}</span>
              </div>
            </div>

            <div className="space-y-2 mt-3">
              <Button variant="outline" className="w-full bg-transparent hover:bg-green-100 hover:text-green-700">
                View Seller Profile
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent hover:bg-green-100 hover:text-green-700"
                onClick={handleViewAllAds}
              >
                See All Ads
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {(product.youtubeUrl || product.websiteUrl) && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {product.youtubeUrl && (
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">YouTube Video</p>
                        <a
                          href={product.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-red-600 hover:text-red-700 hover:underline break-all"
                        >
                          {product.youtubeUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {product.websiteUrl && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Website</p>
                        <a
                          href={
                            product.websiteUrl.startsWith("http") ? product.websiteUrl : `https://${product.websiteUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
                        >
                          {product.websiteUrl}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
