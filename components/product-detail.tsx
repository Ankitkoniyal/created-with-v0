"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Heart, Share2, Flag, MapPin, Eye, Calendar, Star, Shield, Clock, Phone } from "lucide-react"
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
      alert("Please log in to save favorites")
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
      console.error("Error:", error)
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

  const handleShare = async () => {
    const shareData = {
      title: product.title,
      text: `Check out this ${product.title} for ${product.price}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert("Link copied to clipboard!")
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const formatAdId = (id: string) => {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const day = now.getDate().toString().padStart(2, "0")

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let randomLetters = ""
    for (let i = 0; i < 4; i++) {
      randomLetters += letters.charAt(Math.floor(Math.random() * letters.length))
    }

    return `AD${year}${month}${day}${randomLetters}`
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
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleFavorite}
                  title="Add to Wishlist"
                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleShare}
                  title="Share this Ad"
                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-sm text-muted-foreground">Ad ID: </span>
              <span className="text-sm font-medium text-primary">{formatAdId(product.id)}</span>
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
                <Button className="w-full bg-primary hover:bg-primary/90">Chat with Seller</Button>
              </ContactSellerModal>
              <Button
                variant="outline"
                className="w-full bg-transparent flex items-center justify-center"
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

        <Card className="mt-4">
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
              <Button variant="outline" className="w-full bg-transparent">
                View Seller Profile
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={handleViewAllAds}>
                See All Ads
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
