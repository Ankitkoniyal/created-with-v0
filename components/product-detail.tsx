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
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id)
        if (error) {
          console.error("Error removing favorite:", error)
          alert("Failed to remove from favorites")
        } else {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Image Gallery - Compact Version */}
      <div className="lg:col-span-2 space-y-3">
        <Card className="overflow-hidden">
          <CardContent className="p-2">
            <div className="relative aspect-square">
              <img
                src={product.images[selectedImage] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 bg-background/80 hover:bg-background"
                  onClick={toggleFavorite}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 bg-background/80 hover:bg-background"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Compact Thumbnail Gallery */}
            <div className="mt-2">
              <div className="flex gap-1 overflow-x-auto pb-1">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-10 h-10 rounded-md overflow-hidden border ${
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

        {/* Compact Price & Basic Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-lg font-semibold line-clamp-2">{product.title}</h1>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {product.location}
                  </span>
                  <span className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {product.views}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-muted-foreground"
                  onClick={handleShare}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-muted-foreground"
                  onClick={handleReportAd}
                >
                  <Flag className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="mb-3">
              <span className="text-xs text-muted-foreground">Ad ID: </span>
              <span className="text-xs font-medium text-primary">{formatAdId(product.id)}</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold">{product.price}</span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">{product.originalPrice}</span>
              )}
            </div>

            <div className="text-xs text-muted-foreground mb-4 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Posted {new Date(product.postedDate).toLocaleDateString()}
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
                <Button size="sm" className="w-full">
                  Contact
                </Button>
              </ContactSellerModal>
              <Button size="sm" variant="outline" className="w-full">
                Make Offer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Compact Product Details */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">Details</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="truncate">
                <span className="text-muted-foreground">Condition:</span>
                <span className="ml-1 font-medium">{product.condition}</span>
              </div>
              <div className="truncate">
                <span className="text-muted-foreground">Brand:</span>
                <span className="ml-1 font-medium">{product.brand}</span>
              </div>
              <div className="truncate">
                <span className="text-muted-foreground">Model:</span>
                <span className="ml-1 font-medium">{product.model}</span>
              </div>
              <div className="truncate">
                <span className="text-muted-foreground">Category:</span>
                <span className="ml-1 font-medium">{product.category}</span>
              </div>
            </div>

            <Separator className="my-3" />

            <h3 className="font-medium mb-2">Features</h3>
            <ul className="space-y-1.5 text-sm">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 mr-2 flex-shrink-0" />
                  <span className="leading-tight">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Compact Seller Info */}
      <div className="space-y-3">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Seller</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-sm font-medium">
                  {product.seller.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium truncate">{product.seller.name}</span>
                  {product.seller.verified && <Shield className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{product.seller.rating}</span>
                  <span>({product.seller.totalReviews})</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs mb-3">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                <span>Since {product.seller.memberSince}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                <span>{product.seller.responseTime}</span>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full">
              View Profile
            </Button>
          </CardContent>
        </Card>

        {/* Compact Description */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-snug line-clamp-6">
              {product.description}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
