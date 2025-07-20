"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { UserProfileSection } from "@/components/user-profile-section"
import { ReportAdModal } from "@/components/report-ad-modal"
import { SocialShare } from "@/components/social-share"
import { RelatedAds } from "@/components/related-ads"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Flag, Eye, Heart, ArrowLeft, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import { getAllAds, mockUsers } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { useWishlist } from "@/components/wishlist-context"
import { toast } from "@/hooks/use-toast"

export default function AdDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [message, setMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showAllListings, setShowAllListings] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const ad = useMemo(() => {
    const allAds = getAllAds()
    return allAds.find((a) => a.id === params.id)
  }, [params.id])

  const seller = useMemo(() => {
    if (!ad) return null
    const foundSeller = mockUsers.find((u) => u.id === ad.user_id)
    // If seller not found in mockUsers, create a fallback seller
    if (!foundSeller) {
      return {
        id: ad.user_id,
        email: "user@example.com",
        full_name: "Anonymous User",
        phone: "+91 9999999999",
        member_since: "2024-01-01",
        rating: 4.0,
        total_ratings: 1,
      }
    }
    return foundSeller
  }, [ad])

  const otherAdsFromSeller = useMemo(() => {
    if (!ad) return []
    const allAds = getAllAds()
    return allAds.filter((a) => a.user_id === ad.user_id && a.id !== ad.id && a.status === "active").slice(0, 4)
  }, [ad])

  const isWishlisted = ad ? isInWishlist(ad.id) : false

  const handleSendMessage = async () => {
    if (!user || !ad || !message.trim()) return

    setSendingMessage(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Message sent:", {
      ad_id: ad.id,
      sender_id: user.id,
      receiver_id: ad.user_id,
      content: message,
    })

    toast({
      title: "Success",
      description: "Message sent successfully!",
    })
    setMessage("")
    setSendingMessage(false)
  }

  const handleCallRequest = async () => {
    if (!user || !ad) return

    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log("Call request sent:", {
      ad_id: ad.id,
      requester_id: user.id,
      owner_id: ad.user_id,
    })

    toast({
      title: "Success",
      description: "Call request sent successfully!",
    })
  }

  const handleWishlist = () => {
    if (!ad) return

    if (isWishlisted) {
      removeFromWishlist(ad.id)
      toast({
        title: "Removed from Wishlist",
        description: "Item removed from your wishlist",
      })
    } else {
      addToWishlist(ad.id)
      toast({
        title: "Added to Wishlist",
        description: "Item added to your wishlist",
      })
    }
  }

  const nextImage = () => {
    if (ad && ad.images) {
      setCurrentImageIndex((prev) => (prev + 1) % ad.images.length)
    }
  }

  const prevImage = () => {
    if (ad && ad.images) {
      setCurrentImageIndex((prev) => (prev - 1 + ad.images.length) % ad.images.length)
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCondition = (condition: string) => {
    switch (condition) {
      case "second_hand":
        return "Second Hand"
      case "like_new":
        return "Like New"
      case "new":
        return "New"
      default:
        return condition
    }
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Ad not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>234 views</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleWishlist}>
              <Heart className={`h-4 w-4 mr-1 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
              {isWishlisted ? "Saved" : "Save"}
            </Button>
          </div>
        </div>

        {/* Image Gallery - Enhanced with multiple images */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <Image
              src={
                ad.images?.[currentImageIndex] ||
                "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop"
              }
              alt={ad.title}
              fill
              className="object-cover"
            />

            {/* Navigation arrows for multiple images */}
            {ad.images && ad.images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Image counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {ad.images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {ad.images && ad.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {ad.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    index === currentImageIndex ? "border-blue-500" : "border-gray-200"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${ad.title} ${index + 1}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ad Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-3">{ad.title}</CardTitle>
                    <p className="text-3xl font-bold text-blue-600 mb-2">{formatPrice(ad.price)}</p>
                    {ad.negotiable && (
                      <Badge variant="secondary" className="mb-4">
                        Negotiable
                      </Badge>
                    )}
                  </div>
                  {ad.condition && <Badge className="bg-green-500 text-white">{formatCondition(ad.condition)}</Badge>}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {ad.location}, {ad.city}, {ad.state}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Posted on {formatDate(ad.created_at)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">{ad.description}</p>

                {/* Additional Details */}
                {(ad.brand || ad.model || ad.year || ad.manufacturingYear) && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-3">Product Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {ad.brand && (
                        <div>
                          <span className="text-gray-500">Brand:</span>
                          <span className="ml-2 font-medium">{ad.brand}</span>
                        </div>
                      )}
                      {ad.model && (
                        <div>
                          <span className="text-gray-500">Model:</span>
                          <span className="ml-2 font-medium">{ad.model}</span>
                        </div>
                      )}
                      {ad.manufacturingYear && (
                        <div>
                          <span className="text-gray-500">Manufacturing Year:</span>
                          <span className="ml-2 font-medium">{ad.manufacturingYear}</span>
                        </div>
                      )}
                      {ad.year && !ad.manufacturingYear && (
                        <div>
                          <span className="text-gray-500">Year:</span>
                          <span className="ml-2 font-medium">{ad.year}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Condition:</span>
                        <span className="ml-2 font-medium">{formatCondition(ad.condition)}</span>
                      </div>
                      {ad.kmDriven && (
                        <div>
                          <span className="text-gray-500">KM Driven:</span>
                          <span className="ml-2 font-medium">{ad.kmDriven}</span>
                        </div>
                      )}
                      {ad.numberOfOwners && (
                        <div>
                          <span className="text-gray-500">Owners:</span>
                          <span className="ml-2 font-medium">{ad.numberOfOwners}</span>
                        </div>
                      )}
                      {ad.fuelType && (
                        <div>
                          <span className="text-gray-500">Fuel Type:</span>
                          <span className="ml-2 font-medium">{ad.fuelType}</span>
                        </div>
                      )}
                      {ad.transmissionType && (
                        <div>
                          <span className="text-gray-500">Transmission:</span>
                          <span className="ml-2 font-medium">{ad.transmissionType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Ads */}
            <RelatedAds currentAd={ad} maxAds={6} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Information */}
            <UserProfileSection
              user={seller}
              onMessageClick={() => {}}
              onViewAllListings={() => setShowAllListings(true)}
              showViewAllButton={otherAdsFromSeller.length > 0}
            />

            {/* Social Share */}
            <SocialShare title={ad.title} description={ad.description} price={ad.price} imageUrl={ad.images?.[0]} />

            {/* All listings by this user */}
            {showAllListings && otherAdsFromSeller.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">All listings by this user</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {otherAdsFromSeller.slice(0, 2).map((otherAd) => (
                      <div key={otherAd.id} className="border rounded-lg p-3">
                        <div className="flex gap-3">
                          <Image
                            src={
                              otherAd.images?.[0] ||
                              "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg"
                            }
                            alt={otherAd.title}
                            width={60}
                            height={60}
                            className="rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">{otherAd.title}</h4>
                            <p className="text-blue-600 font-semibold text-sm">{formatPrice(otherAd.price)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {otherAdsFromSeller.length > 2 && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm">
                        View All Listings
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Safety Tips */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                  Safety Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• Meet in a safe, public location</p>
                <p>• Inspect the item before payment</p>
                <p>• Don't share personal financial information</p>
                <p>• Trust your instincts</p>
              </CardContent>
            </Card>

            {/* Report Ad and Ad ID */}
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Ad ID:</span>
                    <Badge variant="outline" className="font-mono">
                      {ad.adId}
                    </Badge>
                  </div>

                  <ReportAdModal adId={ad.adId} adTitle={ad.title}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report this Ad
                    </Button>
                  </ReportAdModal>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
