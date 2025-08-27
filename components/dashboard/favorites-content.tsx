"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Heart, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface FavoriteProduct {
  id: string
  product_id: string
  created_at: string
  products: {
    id: string
    title: string
    price: number
    images: string[]
    condition: string
    created_at: string
  }
}

export function FavoritesContent() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("favorites")
          .select(`
            id,
            product_id,
            created_at,
            products (
              id,
              title,
              price,
              images,
              condition,
              created_at
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching favorites:", error)
        } else {
          setFavorites(data || [])
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [user])

  const removeFavorite = async (favoriteId: string, productId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("favorites").delete().eq("id", favoriteId).eq("user_id", user?.id)

      if (error) {
        console.error("Error removing favorite:", error)
        alert("Failed to remove from favorites")
      } else {
        setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId))
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to remove from favorites")
    }
  }

  const filteredFavorites = favorites.filter(
    (favorite) =>
      favorite.products?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      favorite.products?.condition.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">My Favorites</h2>
        <Badge variant="secondary">{favorites.length} items</Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search favorites..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Favorites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFavorites.map((favorite) => {
          const product = favorite.products
          if (!product) return null

          return (
            <Card key={favorite.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <Link href={`/product/${product.id}`}>
                    <img
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={() => removeFavorite(favorite.id, product.id)}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>
                </div>

                <div className="p-4">
                  <Link href={`/product/${product.id}`}>
                    <h4 className="font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary">
                      {product.title}
                    </h4>
                  </Link>
                  <p className="text-2xl font-bold text-primary mb-2">${product.price}</p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{product.condition}</span>
                    <span>Listed {new Date(product.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Added {new Date(favorite.created_at).toLocaleDateString()}</span>
                    <Button size="sm" variant="outline" onClick={() => removeFavorite(favorite.id, product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredFavorites.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? "No favorites found" : "No favorites yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start browsing and save items you like to see them here"}
            </p>
            <Button asChild>
              <Link href="/">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
