"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, MessageSquare, Edit, Trash2, Search, Plus, MoreHorizontal, Package } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import { getOptimizedImageUrl } from "@/lib/images"

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
}

interface ProductWithMessages extends Product {
  messageCount: number
}

export function MyListings() {
  const { user } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<ProductWithMessages[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [accountStatus, setAccountStatus] = useState("active")

  useEffect(() => {
    const fetchUserListings = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        const supabase = createClient()
        
        // Check account status
        const { data: profile } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .single()
        
        if (profile?.status) {
          setAccountStatus(profile.status)
        }

        // Fetch user's products
        const { data: products, error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching listings:", error)
          setListings([])
        } else {
          // Fetch message counts for each product
          const productsWithMessages = await Promise.all(
            (products || []).map(async (product) => {
              const { count, error: messageError } = await supabase
                .from("messages")
                .select("*", { count: 'exact', head: true })
                .eq("product_id", product.id)
                .eq("receiver_id", user.id)

              return {
                ...product,
                messageCount: messageError ? 0 : count || 0
              }
            })
          )

          setListings(productsWithMessages)
        }
      } catch (err) {
        console.error("Error fetching listings:", err)
        setListings([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserListings()

    // Real-time subscription for message updates
    const supabase = createClient()
    const subscription = supabase
      .channel('my-listings-messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`
        }, 
        () => {
          fetchUserListings() // Refresh data when messages change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "sold":
        return "secondary"
      case "paused":
        return "outline"
      default:
        return "secondary"
    }
  }

  const handleEditAd = (id: string) => {
    if (accountStatus === "deactivated") {
      alert("Your account is deactivated. Please reactivate it to edit ads.")
      return
    }
    router.push(`/sell?edit=${id}`)
  }

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("products").delete().eq("id", id).eq("user_id", user?.id)

      if (error) {
        console.error("Error deleting ad:", error)
        alert("Failed to delete ad")
      } else {
        setListings((prev) => prev.filter((listing) => listing.id !== id))
        alert("Ad deleted successfully")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to delete ad")
    }
  }

  const handleMarkSold = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("products").update({ status: "sold" }).eq("id", id).eq("user_id", user?.id)

      if (error) {
        console.error("Error updating ad:", error)
        alert("Failed to update ad")
      } else {
        setListings((prev) => prev.map((listing) => (listing.id === id ? { ...listing, status: "sold" } : listing)))
        alert("Ad marked as sold")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to update ad")
    }
  }

  const handleMarkActive = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("products")
        .update({ status: "active" })
        .eq("id", id)
        .eq("user_id", user?.id)

      if (error) {
        console.error("Error updating ad:", error)
        alert("Failed to update ad")
      } else {
        setListings((prev) => prev.map((listing) => (listing.id === id ? { ...listing, status: "active" } : listing)))
        alert("Ad marked as active")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to update ad")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading your ads...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {accountStatus === "deactivated" && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Account Deactivated</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Your account is currently deactivated. You cannot post new ads until you reactivate your account.</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Button
                    variant="outline"
                    className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300"
                    asChild
                  >
                    <Link href="/dashboard/settings">Reactivate Account</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your listings..."
              className="pl-10 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild disabled={accountStatus === "deactivated"}>
          <Link href="/sell">
            <Plus className="h-4 w-4 mr-2" />
            Post New Ad
          </Link>
        </Button>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden">
            <div className="relative h-48">
              <Image
                src={getOptimizedImageUrl(listing.images?.[0], "thumb") || "/placeholder.svg"}
                alt={listing.title}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
              <Badge className="absolute top-2 right-2" variant={getStatusColor(listing.status) as any}>
                {listing.status}
              </Badge>
            </div>

            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-foreground line-clamp-2">{listing.title}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditAd(listing.id)} disabled={accountStatus === "deactivated"}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Ad
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/product/${listing.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Public
                      </Link>
                    </DropdownMenuItem>
                    {listing.status === "active" ? (
                      <DropdownMenuItem onClick={() => handleMarkSold(listing.id)}>
                        <Package className="h-4 w-4 mr-2" />
                        Mark as Sold
                      </DropdownMenuItem>
                    ) : listing.status === "sold" ? (
                      <DropdownMenuItem onClick={() => handleMarkActive(listing.id)}>
                        <Package className="h-4 w-4 mr-2" />
                        Mark as Active
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAd(listing.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Ad
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-2xl font-bold text-primary mb-3">${listing.price}</p>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <span>{listing.category}</span>
                <span>Posted {new Date(listing.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {listing.views || 0}
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {listing.messageCount}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditAd(listing.id)} disabled={accountStatus === "deactivated"}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/dashboard/messages">
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  </Button>
                  {listing.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => handleMarkSold(listing.id)}>
                      <Package className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredListings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No listings found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "You haven't created any listings yet"}
            </p>
            <Button asChild disabled={accountStatus === "deactivated"}>
              <Link href="/sell">Post Your First Ad</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
