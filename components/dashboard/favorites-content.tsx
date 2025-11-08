"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Heart, Search, Eye, MessageSquare, MapPin, X } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import { getOptimizedImageUrl } from "@/lib/images"
import { toast } from "sonner"

interface Product {
  id: string
  title: string
  price: number
  status: string
  views: number
  images: string[]
  category: string
  created_at: string
  user_id: string
  location: string
}

export function FavoritesContent() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        
        // Get favorite product IDs
        const { data: favoritesData, error: favoritesError } = await supabase
          .from("favorites")
          .select("product_id")
          .eq("user_id", user.id)

        if (favoritesError) {
          console.error("Error fetching favorites:", favoritesError)
          toast.error("Failed to load favorites")
          setFavorites([])
          return
        }

        if (!favoritesData || favoritesData.length === 0) {
          setFavorites([])
          return
        }

        // Get product details for each favorite
        const productIds = favoritesData.map(fav => fav.product_id)
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds)
          .order("created_at", { ascending: false })

        if (productsError) {
          console.error("Error fetching favorite products:", productsError)
          toast.error("Failed to load favorite products")
          setFavorites([])
        } else {
          setFavorites(products || [])
        }
      } catch (error) {
      console.error("Error fetching favorites:", error)
      toast.error("Failed to load favorites")
        setFavorites([])
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [user])

  const handleRemoveFavorite = async (productId: string) => {
    if (!user) return

    setRemovingId(productId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)

      if (error) {
        console.error("Error removing favorite:", error)
        toast.error("Failed to remove from favorites")
      } else {
        setFavorites(prev => prev.filter(product => product.id !== productId))
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to remove from favorites")
    } finally {
      setRemovingId(null)
    }
  }

  const filteredFavorites = favorites.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading your favorites...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">My Favorites</h2>
          <p className="text-muted-foreground mt-1">
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your favorites..."
            className="pl-10 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Favorites Grid */}
      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
              <div className="relative h-48">
                <Image
                  src={getOptimizedImageUrl(product.images?.[0], "thumb") || "/placeholder.svg"}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge 
                  className="absolute top-2 left-2" 
                  variant={product.status === "active" ? "default" : "secondary"}
                >
                  {product.status}
                </Badge>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                  onClick={() => handleRemoveFavorite(product.id)}
                  disabled={removingId === product.id}
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2 mb-1">{product.title}</h3>
                    <p className="text-2xl font-bold text-primary">${product.price}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="capitalize">{product.category}</span>
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {product.views || 0}
                    </div>
                  </div>

                  {product.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{product.location}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/product/${product.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/messages?product=${product.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            {searchTerm ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No favorites found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria
                </p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start browsing and save items you love
                </p>
                <Button asChild>
                  <Link href="/">Browse Products</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}