"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Shield, Calendar, MapPin, Package, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ProductGrid } from "@/components/product-grid"
import { ContactSellerModal } from "@/components/messaging/contact-seller-modal"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SellerProfile {
  id: string
  full_name: string
  avatar_url?: string
  location?: string
  bio?: string
  created_at: string
  verified?: boolean
}

interface Product {
  id: string
  title: string
  price: number
  images: string[]
  category: string
  created_at: string
  status: string
}

interface SellerPageProps {
  params: Promise<{
    sellerId: string
  }>
}

export default function SellerProfilePage({ params }: SellerPageProps) {
  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("ads")
  const [showContactModal, setShowContactModal] = useState(false)
  const [sellerId, setSellerId] = useState<string>("")
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setSellerId(resolvedParams.sellerId)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!sellerId) return

    const fetchSellerData = async () => {
      try {
        const supabase = createClient()

        const { data: sellerData, error: sellerError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sellerId)
          .single()

        if (sellerError) {
          console.error("Error fetching seller:", sellerError)
          return
        }

        setSeller(sellerData)

        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", sellerId)
          .eq("status", "active")
          .order("created_at", { ascending: false })

        if (productsError) {
          console.error("Error fetching products:", productsError)
        } else {
          setProducts(productsData || [])
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSellerData()
  }, [sellerId])

  const handleContactSeller = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (user.id === sellerId) {
      return
    }

    setShowContactModal(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading seller profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Seller Not Found</h3>
            <p className="text-muted-foreground mb-4">The seller profile you&apos;re looking for doesn&apos;t exist.</p>
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Seller Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={seller.avatar_url || "/placeholder.svg"} alt={seller.full_name} />
              <AvatarFallback className="text-2xl">
                {seller.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{seller.full_name}</h1>
                {seller.verified && (
                  <Badge variant="secondary" className="flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                  <span>New Member</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Member since{" "}
                    {new Date(seller.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
                {seller.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{seller.location}</span>
                  </div>
                )}
              </div>

              {seller.bio && <p className="text-muted-foreground">{seller.bio}</p>}
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                className="bg-green-900 hover:bg-green-950"
                onClick={handleContactSeller}
                disabled={user?.id === sellerId}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {user?.id === sellerId ? "Your Profile" : "Contact Seller"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">{products.length} active ads</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seller's Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            All Ads ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Active Ads</h3>
              <p className="text-muted-foreground">This seller doesn&apos;t have any active listings at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Seller Modal */}
      {showContactModal && seller && (
        <ContactSellerModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          seller={{
            id: seller.id,
            name: seller.full_name,
            avatar: seller.avatar_url,
          }}
          product={products[0] || null} // Use first product or null if no products
        />
      )}
    </div>
  )
}
