"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  Heart,
  Share2,
  MapPin,
  Eye,
  Calendar,
  Star,
  Phone,
  Flag,
  Copy,
  Check,
  Facebook,
  Mail,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { getOptimizedImageUrl } from "@/lib/images"
import { toast } from "@/components/ui/use-toast"
import { SafetyBanner } from "@/components/ui/safety-banner"
import { RelatedAds } from "@/components/related-ads"

interface Product {
  id: string
  title: string
  price: string
  location: string
  images: string[]
  description: string
  category: string
  postedDate: string
  views: number
  adId?: string
  seller: {
    id: string
    name: string
    rating: number
    totalReviews: number
    memberSince: string
    verified: boolean
    avatar?: string | null
    phone?: string | null
  }
}

interface ProductDetailProps {
  product: Product
  relatedAds?: Product[]
}

export function ProductDetail({ product, relatedAds = [] }: ProductDetailProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showMobileNumber, setShowMobileNumber] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const shareMenuRef = useRef<HTMLDivElement>(null)
  const adDisplayId = (product.adId || product.id).slice(-6)

  // Close share menu if clicked outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Check favorite status
  useEffect(() => {
    const checkFav = async () => {
      if (!user) return
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .single()
      setIsFavorited(!!data)
    }
    checkFav()
  }, [user, product.id])

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to save ads." })
      return
    }
    if (isFavorited) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id)
      setIsFavorited(false)
      toast({ title: "Removed from wishlist" })
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id })
      setIsFavorited(true)
      toast({ title: "Added to wishlist" })
    }
  }

  // Copy Ad ID
  const copyAdId = async () => {
    await navigator.clipboard.writeText(adDisplayId)
    setLinkCopied(true)
    toast({ title: "Ad ID copied!" })
    setTimeout(() => setLinkCopied(false), 2000)
  }

  // Report ad
  const reportAd = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to report ads." })
      return
    }
    await supabase.from("reports").insert({
      product_id: product.id,
      user_id: user.id,
      reason: "User report",
    })
    toast({ title: "Report submitted", description: "Thanks for keeping the marketplace safe." })
  }

  // Share links
  const shareTo = (platform: "whatsapp" | "facebook" | "email") => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Check this out: ${product.title}`)
    let shareUrl = ""
    if (platform === "whatsapp") shareUrl = `https://wa.me/?text=${text}%20${url}`
    if (platform === "facebook") shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
    if (platform === "email") shareUrl = `mailto:?subject=${text}&body=${url}`
    window.open(shareUrl, "_blank")
    setShowShareMenu(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Images + Description + Related */}
      <div className="lg:col-span-2 space-y-4">
        {/* Images */}
        <Card>
          <CardContent className="p-0">
            <div className="relative h-96 bg-gray-50">
              <Image
                src={getOptimizedImageUrl(product.images?.[selectedImage], "detail") || "/placeholder.svg"}
                alt={product.title}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex space-x-2 p-3 overflow-x-auto">
              {product.images?.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    selectedImage === i ? "border-green-700" : "border-gray-200"
                  }`}
                >
                  <Image src={getOptimizedImageUrl(img, "thumb") || "/placeholder.svg"} alt="thumb" width={64} height={64} />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Description below images */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-2">Description</h2>
            <p className="text-sm whitespace-pre-line">{product.description}</p>
          </CardContent>
        </Card>

        {/* Related Ads */}
        {relatedAds.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-bold mb-3">Related Ads</h2>
              <RelatedAds ads={relatedAds.slice(0, 3)} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT: Info + Seller + Safety + Report */}
      <div className="space-y-4">
        {/* Info */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h1 className="text-xl font-bold">{product.title}</h1>
            <div className="text-2xl font-bold text-green-800">{product.price}</div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" /> {product.location}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Eye className="w-4 h-4 mr-1" /> {product.views} views
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" /> Posted {new Date(product.postedDate).toLocaleDateString()}
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span>Ad ID: <b>{adDisplayId}</b></span>
              <Button size="sm" onClick={copyAdId} className="bg-green-900 hover:bg-green-950 text-white">
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-3">
              <Button onClick={toggleFavorite} className="bg-green-900 hover:bg-green-950 w-1/2">
                <Heart className="w-4 h-4 mr-1" /> {isFavorited ? "Saved" : "Wishlist"}
              </Button>
              <div className="relative w-1/2" ref={shareMenuRef}>
                <Button onClick={() => setShowShareMenu(!showShareMenu)} className="bg-green-900 hover:bg-green-950 w-full">
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 bg-white border rounded shadow-md w-48 z-50">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => shareTo("whatsapp")}>
                      📱 WhatsApp
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => shareTo("facebook")}>
                      <Facebook className="w-4 h-4 mr-2" /> Facebook
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => shareTo("email")}>
                      <Mail className="w-4 h-4 mr-2" /> Email
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={copyAdId}>
                      {linkCopied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                      {linkCopied ? "Copied!" : "Copy Link"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seller */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-bold">Seller Info</h2>
            <div className="flex items-center space-x-3">
              {product.seller.avatar ? (
                <Image src={product.seller.avatar} alt={product.seller.name} width={48} height={48} className="rounded-full" />
              ) : (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-900">
                  {product.seller.name[0]}
                </div>
              )}
              <div>
                <div className="font-semibold">{product.seller.name}</div>
                <div className="text-sm text-gray-600 flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" /> {product.seller.rating} ({product.seller.totalReviews} reviews)
                </div>
              </div>
            </div>
            <Button className="bg-green-900 hover:bg-green-950 w-full">Chat with Seller</Button>
            <Button onClick={() => setShowMobileNumber(true)} className="bg-green-900 hover:bg-green-950 w-full">
              <Phone className="w-4 h-4 mr-1" /> {showMobileNumber ? product.seller.phone || "N/A" : "Show Mobile"}
            </Button>
          </CardContent>
        </Card>

        {/* Stay Safe */}
        <SafetyBanner />

        {/* Report Ad */}
        <Card>
          <CardContent className="p-4">
            <Button onClick={reportAd} className="bg-red-600 hover:bg-red-700 w-full">
              <Flag className="w-4 h-4 mr-1" /> Report this Ad
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
