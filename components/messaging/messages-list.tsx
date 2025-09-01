"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageSquare, Package } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface Conversation {
  id: string
  product_id: string
  sender_id: string
  receiver_id: string
  created_at: string
  products: {
    id: string
    title: string
    price: number
    images: string[]
    status: string
  }
  sender_profile: {
    id: string
    full_name: string
    avatar_url: string
  }
  receiver_profile: {
    id: string
    full_name: string
    avatar_url: string
  }
  participant: {
    id: string
    full_name: string
    avatar_url: string
  }
  latest_message: {
    message: string
    created_at: string
    sender_id: string
  }
  unread_count: number
}

export function MessagesList() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "active" | "sold">("all")

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      try {
        const supabase = createClient()

        const { data, error } = await supabase
          .from("messages")
          .select(`
            id,
            product_id,
            sender_id,
            receiver_id,
            message,
            is_read,
            created_at,
            products (
              id,
              title,
              price,
              images,
              status
            ),
            sender:profiles!sender_id (
              id,
              full_name,
              avatar_url
            ),
            receiver:profiles!receiver_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching conversations:", error)
        } else {
          console.log("[v0] Fetched conversations:", data)

          // Group messages by conversation (product + participants)
          const conversationMap = new Map<string, any>()

          data?.forEach((message: any) => {
            const otherParticipant = message.sender_id === user.id ? message.receiver : message.sender
            const conversationKey = `${message.product_id}-${otherParticipant.id}`

            const isUnreadForMe =
              message.receiver_id === user.id && message.sender_id === otherParticipant.id && message.is_read === false

            const existing = conversationMap.get(conversationKey)
            if (!existing) {
              conversationMap.set(conversationKey, {
                id: conversationKey,
                product_id: message.product_id,
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                created_at: message.created_at,
                products: message.products,
                participant: otherParticipant,
                latest_message: {
                  message: message.message,
                  created_at: message.created_at,
                  sender_id: message.sender_id,
                },
                unread_count: isUnreadForMe ? 1 : 0,
              })
            } else {
              if (isUnreadForMe) {
                existing.unread_count += 1
              }
            }
          })

          const conversationsList = Array.from(conversationMap.values())
          setConversations(conversationsList)

          const subscription = supabase
            .channel("messages_list")
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "messages",
              },
              (payload) => {
                console.log("[v0] New message in conversations list:", payload)

                // Check if this message involves the current user
                if (payload.new.sender_id === user.id || payload.new.receiver_id === user.id) {
                  // Refresh conversations to get updated data
                  fetchConversations()
                }
              },
            )
            .subscribe()

          // Cleanup subscription on unmount
          return () => {
            subscription.unsubscribe()
          }
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [user])

  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch =
      conversation.participant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.products?.title?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && conversation.unread_count > 0) ||
      (filter === "active" && conversation.products?.status === "active") ||
      (filter === "sold" && conversation.products?.status === "sold")

    return matchesSearch && matchesFilter
  })

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Conversations</h2>
          <p className="text-muted-foreground">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                All
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unread")}
              >
                Unread {totalUnread > 0 && <Badge className="ml-1">{totalUnread}</Badge>}
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
              >
                Active
              </Button>
              <Button variant={filter === "sold" ? "default" : "outline"} size="sm" onClick={() => setFilter("sold")}>
                Sold
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      <div className="space-y-2">
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No conversations found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "Start selling to receive messages from buyers"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredConversations.map((conversation) => (
            <Link key={conversation.id} href={`/dashboard/messages/${conversation.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 flex-shrink-0">
                      <img
                        src={
                          conversation.products?.images?.[0] ||
                          "/placeholder.svg?height=64&width=64&query=product-thumbnail"
                        }
                        alt={conversation.products?.title || "Product"}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={conversation.participant?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {conversation.participant?.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">
                            {conversation.participant?.full_name || "Unknown User"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.latest_message?.created_at)}
                          </span>
                          {conversation.unread_count > 0 && (
                            <Badge className="bg-primary text-primary-foreground">{conversation.unread_count}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate">{conversation.products?.title}</span>
                        <span className="text-sm font-medium text-primary">${conversation.products?.price}</span>
                      </div>

                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.latest_message?.sender_id === user?.id ? "You: " : ""}
                        {conversation.latest_message?.message}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <Badge variant={conversation.products?.status === "active" ? "default" : "secondary"}>
                        {conversation.products?.status || "unknown"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
