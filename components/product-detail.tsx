"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Heart, Share2, Flag, MapPin, Eye, Calendar, Star, Shield, Clock } from "lucide-react"
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
        // Remove from favorites
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id)

        if (error) {
          console.error("Error removing favorite:", error)
          alert("Failed to remove from favorites")
        } else {
          console.log("[v0] Removed from favorites:", product.id)
          setIsFavorited(false)
        }
      } else {
        // Add to favorites
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
      // Here you would typically send the report to your backend
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
        // Fallback: copy to clipboard
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

    // Generate 4 random alphabetical letters
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let randomLetters = ""
    for (let i = 0; i < 4; i++) {
      randomLetters += letters.charAt(Math.floor(Math.random() * letters.length))
    }

    return `AD${year}${month}${day}${randomLetters}`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Image Gallery */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={product.images[selectedImage] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-96 object-cover rounded-t-lg"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-4 right-4 bg-background/80 hover:bg-background"
                onClick={toggleFavorite}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-4 right-16 bg-background/80 hover:bg-background"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Thumbnail Gallery */}
            <div className="p-4">
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
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

        {/* Price & Basic Info */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{product.title}</h1>
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
                  onClick={handleShare}
                  title="Share this Ad"
                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReportAd}
                  title="Report this Ad"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mb-3">
              <span className="text-sm text-muted-foreground">Ad ID: </span>
              <span className="text-sm font-medium text-primary">{formatAdId(product.id)}</span>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl font-bold text-primary">{product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">{product.originalPrice}</span>
              )}
            </div>

            <div className="flex items-center text-sm text-muted-foreground mb-6">
              <Calendar className="h-4 w-4 mr-1" />
              Posted on {new Date(product.postedDate).toLocaleDateString()}
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Button className="w-full bg-primary hover:bg-primary/90">Contact Seller</Button>
              </ContactSellerModal>
              <Button variant="outline" className="w-full bg-transparent">
                Make an Offer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Summary */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Product Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <span className="text-muted-foreground">Ad ID:</span>
                <span className="ml-2 font-medium text-primary">{formatAdId(product.id)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Price:</span>
                <span className="ml-2 font-bold text-lg text-primary">{product.price}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Condition:</span>
                <span className="ml-2 font-medium">{product.condition}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <span className="ml-2 font-medium">{product.category}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Product Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
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

            <Separator className="my-6" />

            <h3 className="font-semibold text-foreground mb-3">Key Features</h3>
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Product Info & Seller */}
      <div className="space-y-6">
        {/* Seller Info */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Seller Information</h3>

            <div className="flex items-center space-x-3 mb-4">
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

            <Button variant="outline" className="w-full mt-4 bg-transparent">
              View Seller Profile
            </Button>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
