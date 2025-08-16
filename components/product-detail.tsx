"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Heart, Share2, Flag, MapPin, Eye, Calendar, Star, Shield, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { ContactSellerModal } from "@/components/messaging/contact-seller-modal"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

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
    id: string
    name: string
    rating: number
    totalReviews: number
    memberSince: string
    verified: boolean
    responseTime: string
    avatar?: string
  }
  features: string[]
  specifications?: Record<string, string>
  shippingOptions?: {
    localPickup: boolean
    shipping: boolean
    cost?: string
  }
  [key: string]: any
}

export function ProductListings() {
  const router = useRouter()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12)

        if (error) throw error

        setProducts(data || [])
        setLoading(false)
      } catch (err) {
        setError("Failed to load products")
        setLoading(false)
        console.error("Error fetching products:", err)
      }
    }

    const fetchFavorites = async () => {
      if (!user) return
      
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("favorites")
          .select("product_id")
          .eq("user_id", user.id)

        if (error) throw error

        const favSet = new Set(data?.map(item => item.product_id))
        setFavorites(favSet)
      } catch (err) {
        console.error("Error fetching favorites:", err)
      }
    }

    fetchProducts()
    fetchFavorites()
  }, [user])

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    try {
      const supabase = createClient()
      const isFavorite = favorites.has(productId)

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)

        if (!error) {
          setFavorites(prev => {
            const newFavs = new Set(prev)
            newFavs.delete(productId)
            return newFavs
          })
        }
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            product_id: productId
          })

        if (!error) {
          setFavorites(prev => new Set(prev).add(productId))
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(Number(price))
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-48 w-full rounded-lg mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-500 mb-4">
          <Flag className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium mb-2">Error loading products</h3>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Latest Ads</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              {/* Image Gallery */}
              <div className="relative aspect-square">
                {product.images?.length > 0 ? (
                  <>
                    <Image
                      src={product.images[currentImageIndex]}
                      alt={product.title}
                      fill
                      className="object-cover rounded-t-lg"
                      priority
                    />
                    {product.images.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {product.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full ${
                              currentImageIndex === index 
                                ? "bg-primary" 
                                : "bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}

                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 bg-background/80 hover:bg-background"
                    onClick={() => toggleFavorite(product.id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favorites.has(product.id) 
                          ? "fill-red-500 text-red-500" 
                          : ""
                      }`}
                    />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 bg-background/80 hover:bg-background"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                {product.featured && (
                  <Badge className="absolute top-2 left-2 bg-primary/90 hover:bg-primary">
                    FEATURED
                  </Badge>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold line-clamp-2">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span>{product.views}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{product.location}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(product.postedDate)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {product.seller.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="flex gap-2">
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
                    <Button size="sm" className="flex-1">
                      Contact
                    </Button>
                  </ContactSellerModal>
                  <Button variant="outline" size="sm" className="flex-1">
                    Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <div className="flex gap-1">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
