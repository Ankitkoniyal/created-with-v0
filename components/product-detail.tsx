"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Heart, Share2, Flag, MapPin, Eye, Calendar, Star, Shield, Clock, Phone, X, Copy, Check, ChevronRight } from "lucide-react"
import { ContactSellerModal } from "@/components/messaging/contact-seller-modal"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

interface Product {
  id: string
  title: string
  price: string
  originalPrice?: string
  location: string
  images: string[]
  description: string
  category: string
  condition: string
  brand: string
  model: string
  postedDate: string
  views: number
  seller: {
    name: string
    rating: number
    totalReviews: number
    memberSince: string
    verified: boolean
    responseTime: string
  }
  features: string[]
  storage?: string
  color?: string
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
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);

  // Function to display a temporary message
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000); // Hide message after 3 seconds
  };

  // Function to show a confirmation dialog
  const showConfirmationDialog = (msg: string, onConfirm: () => void) => {
    setMessage(msg);
    setConfirmationAction(() => onConfirm);
    setShowConfirmation(true);
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (confirmationAction) {
      confirmationAction();
    }
    setShowConfirmation(false);
    setMessage(null);
    setConfirmationAction(null);
  };

  // Handle cancellation of confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setMessage(null);
    setConfirmationAction(null);
  };

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) return

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
        console.error("Error:", error)
      }
    }

    checkFavoriteStatus()
  }, [user, product.id])

  const toggleFavorite = async () => {
    if (!user) {
      showMessage("Please log in to save favorites")
      return
    }

    try {
      const supabase = createClient()

      if (isFavorited) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id)

        if (error) {
          console.error("Error removing favorite:", error)
          showMessage("Failed to remove from favorites")
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
          showMessage("Failed to add to favorites")
        } else {
          console.log("[v0] Added to favorites:", product.id)
          setIsFavorited(true)
        }
      }
    } catch (error) {
      console.error("Error:", error)
      showMessage("Failed to update favorites")
    }
  }

  const handleReportAd = () => {
    if (!user) {
      showMessage("Please log in to report this ad")
      return
    }

    showConfirmationDialog(
      "Are you sure you want to report this ad? This will notify our moderation team for review.",
      () => {
        console.log("[v0] Reporting ad:", product.id)
        showMessage("Thank you for your report. Our team will review this ad shortly.")
      }
    )
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
      const url = window.location.href;
      const tempInput = document.createElement('input');
      document.body.appendChild(tempInput);
      tempInput.value = url;
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setLinkCopied(true);
      setTimeout(() => {
        setLinkCopied(false);
        setShowShareMenu(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link:", error)
      showMessage("Failed to copy link. Please copy the URL manually from the address bar.")
      setShowShareMenu(false)
    }
  }

  const handleShare = () => {
    setShowShareMenu(!showShareMenu)
  }

  // The formatAdId function has been removed to fix the hydration mismatch error.
  // The product ID will now be displayed directly from the product object.

  const handleViewAllAds = () => {
    window.location.href = `/seller/${product.seller.name.toLowerCase().replace(/\s+/g, "-")}/ads`
  }

  const handleViewAllReviews = () => {
    window.location.href = `/seller/${product.seller.name.toLowerCase().replace(/\s+/g, "-")}/reviews`
  }

  const handleShowMobile = () => {
    if (!user) {
      showMessage("Please log in to view seller's contact information")
      return
    }
    setShowMobileNumber(true)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* The Header component has been removed from here as it should be in the root layout file */}
      <main className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* The breadcrumb was here and has been removed */}
            <Card className="rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={product.images[selectedImage] || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-80 object-cover"
                  />
                </div>

                <div className="p-3">
                  <div className="flex space-x-2 overflow-x-auto">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          selectedImage === index ? "border-green-700" : "border-transparent hover:border-gray-300"
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

            <Card className="mt-4 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">{product.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-green-600" />
                        {product.location}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1 text-green-600" />
                        {product.views} views
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleFavorite}
                      className="text-green-700 hover:bg-green-100 hover:text-green-700 border-green-700/20 bg-transparent rounded-full px-4 py-2"
                    >
                      <Heart className={`h-4 w-4 mr-1 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                      {isFavorited ? "Saved" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleShare}
                      className="text-green-700 hover:bg-green-100 hover:text-green-700 border-green-700/20 bg-transparent rounded-full px-4 py-2"
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
                  <span className="text-sm font-medium text-primary">{product.id}</span>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl font-bold text-green-800">{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">{product.originalPrice}</span>
                  )}
                </div>

                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4 mr-1 text-green-600" />
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
                    <Button className="w-full bg-green-700 hover:bg-green-800 text-white rounded-full">Chat with Seller</Button>
                  </ContactSellerModal>
                  <Button
                    className="w-full bg-green-700 hover:bg-green-800 text-white rounded-full"
                    onClick={handleShowMobile}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {showMobileNumber ? "+1 (555) 123-****" : "Show Mobile"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4 rounded-2xl">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>

            <Card className="mt-4 rounded-2xl">
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
                      <div className="w-2 h-2 bg-green-700 rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-4 rounded-2xl">
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
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Seller Information</h3>

                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-green-700/10 rounded-full flex items-center justify-center">
                    <span className="text-green-700 font-semibold">
                      {product.seller.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{product.seller.name}</span>
                      {product.seller.verified && <Shield className="h-4 w-4 text-green-700" />}
                    </div>
                    <button
                      onClick={handleViewAllReviews}
                      className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-green-700 transition-colors"
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.seller.rating}</span>
                      <span>({product.seller.totalReviews} reviews)</span>
                    </button>
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
                  <Button className="w-full bg-green-700 hover:bg-green-800 text-white rounded-full">
                    View Seller Profile
                  </Button>
                  <Button
                    className="w-full bg-green-700 hover:bg-green-800 text-white rounded-full"
                    onClick={handleViewAllAds}
                  >
                    See All Ads
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      {message && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <p className="text-center font-semibold mb-4">{message}</p>
            {showConfirmation && (
              <div className="flex justify-center gap-4">
                <Button onClick={handleConfirm} className="bg-green-700 hover:bg-green-800 text-white rounded-full">Yes</Button>
                <Button onClick={handleCancelConfirmation} variant="outline" className="rounded-full">No</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
