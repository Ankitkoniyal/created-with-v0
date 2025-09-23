"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, MoreVertical, Package } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  message: string
  created_at: string
  sender_id: string
  is_read: boolean
  sender: {
    id: string
    full_name: string
    avatar_url: string
  }
}

interface ConversationData {
  product: {
    id: string
    title: string
    price: number
    images: string[]
    condition: string
    location: string
  }
  participant: {
    id: string
    full_name: string
    avatar_url: string
  }
  messages: Message[]
}

interface ConversationViewProps {
  conversationId: string
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState("")
  const [conversationData, setConversationData] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversationData?.messages])

  const markMessagesAsRead = async (productId: string, participantId: string) => {
    if (!user) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("product_id", productId)
        .eq("sender_id", participantId)
        .eq("receiver_id", user.id)
        .eq("is_read", false)

      if (error) {
        console.error("Error marking messages as read:", error)
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const parseConversationId = (conversationId: string) => {
    // UUID format: 8-4-4-4-12 characters (36 total including hyphens)
    // Conversation ID format: {productId}-{participantId}
    // We need to find where the first UUID ends and second begins

    const parts = conversationId.split("-")
    if (parts.length < 8) {
      throw new Error("Invalid conversation ID format")
    }

    // First UUID: parts[0]-parts[1]-parts[2]-parts[3]-parts[4]
    const productId = parts.slice(0, 5).join("-")
    // Second UUID: parts[5]-parts[6]-parts[7]-parts[8]-parts[9]
    const participantId = parts.slice(5, 10).join("-")

    return { productId, participantId }
  }

  useEffect(() => {
    const fetchConversation = async () => {
      if (!user) return

      try {
        const supabase = createClient()

        const { productId, participantId } = parseConversationId(conversationId)

        await markMessagesAsRead(productId, participantId)

        const { data: messages, error: messagesError } = await supabase
          .from("messages")
          .select(`
            id,
            message,
            created_at,
            sender_id,
            is_read,
            sender:profiles!sender_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq("product_id", productId)
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`,
          )
          .order("created_at", { ascending: true })

        const { data: product, error: productError } = await supabase
          .from("products")
          .select("id, title, price, images, condition, location")
          .eq("id", productId)
          .single()

        const { data: participant, error: participantError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", participantId)
          .single()

        if (messagesError || productError || participantError) {
          console.error("Error fetching conversation:", { messagesError, productError, participantError })
        } else {
          setConversationData({
            product,
            participant,
            messages: messages || [],
          })

          const subscription = supabase
            .channel(`messages:${productId}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `product_id=eq.${productId}`,
              },
              async (payload) => {
                const { data: newMessage, error } = await supabase
                  .from("messages")
                  .select(`
                    id,
                    message,
                    created_at,
                    sender_id,
                    is_read,
                    sender:profiles!sender_id (
                      id,
                      full_name,
                      avatar_url
                    )
                  `)
                  .eq("id", payload.new.id)
                  .single()

                if (!error && newMessage) {
                  const isRelevantMessage =
                    (newMessage.sender_id === user.id && payload.new.receiver_id === participantId) ||
                    (newMessage.sender_id === participantId && payload.new.receiver_id === user.id)

                  if (isRelevantMessage) {
                    setConversationData((prev) =>
                      prev
                        ? {
                            ...prev,
                            messages: [...prev.messages, newMessage],
                          }
                        : null,
                    )
                  }
                }
              },
            )
            .subscribe()

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

    fetchConversation()
  }, [conversationId, user])

  const handleDeleteConversation = async () => {
    if (!user || !conversationData) return

    const confirmed = window.confirm("Are you sure you want to delete this conversation? This action cannot be undone.")
    if (!confirmed) return

    setIsDeleting(true)

    try {
      const supabase = createClient()
      const { productId, participantId } = parseConversationId(conversationId)

      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("product_id", productId)
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`,
        )

      if (error) {
        console.error("Error deleting conversation:", error)
        alert("Failed to delete conversation")
      } else {
        window.location.href = "/dashboard/messages"
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to delete conversation")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBlockUser = async () => {
    if (!user || !conversationData) return

    const confirmed = window.confirm(
      `Are you sure you want to block ${conversationData.participant.full_name}? They won't be able to message you anymore.`,
    )
    if (!confirmed) return

    setIsBlocking(true)

    try {
      const supabase = createClient()
      const { productId, participantId } = parseConversationId(conversationId)

      const { error } = await supabase.from("blocked_users").insert({
        blocker_id: user.id,
        blocked_id: participantId,
        reason: "Blocked from conversation",
      })

      if (error) {
        console.error("Error blocking user:", error)
        alert("Failed to block user")
      } else {
        alert(`${conversationData.participant.full_name} has been blocked`)
        window.location.href = "/dashboard/messages"
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to block user")
    } finally {
      setIsBlocking(false)
    }
  }

  const handleReportConversation = async () => {
    if (!user || !conversationData) return

    const reason = window.prompt("Please provide a reason for reporting this conversation:")
    if (!reason) return

    setIsReporting(true)

    try {
      const supabase = createClient()
      const { productId, participantId } = parseConversationId(conversationId)

      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: participantId,
        product_id: productId,
        reason: reason,
        type: "conversation",
      })

      if (error) {
        console.error("Error reporting conversation:", error)
        alert("Failed to report conversation")
      } else {
        alert("Thank you for your report. We'll review it shortly.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to report conversation")
    } finally {
      setIsReporting(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !conversationData) return

    try {
      const supabase = createClient()
      const { productId, participantId } = parseConversationId(conversationId)

      // Prevent sending if either party has blocked the other
      const { data: blockCheck, error: blockErr } = await supabase
        .from("blocked_users")
        .select("id")
        .or(
          `and(blocker_id.eq.${user.id},blocked_id.eq.${participantId}),and(blocker_id.eq.${participantId},blocked_id.eq.${user.id})`,
        )
        .limit(1)

      if (!blockErr && blockCheck && blockCheck.length > 0) {
        alert("Messaging is unavailable because one of the users has been blocked.")
        return
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          product_id: productId,
          sender_id: user.id,
          receiver_id: participantId,
          message: newMessage.trim(),
          is_read: false,
        })
        .select(`
          id,
          message,
          created_at,
          sender_id,
          is_read,
          sender:profiles!sender_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error("Error sending message:", error)
        alert("Failed to send message")
      } else {
        setConversationData((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, data],
              }
            : null,
        )
        setNewMessage("")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to send message")
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!conversationData) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/messages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Link>
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Conversation not found</h3>
            <p className="text-muted-foreground">This conversation may have been deleted or doesn&apos;t exist.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/dashboard/messages">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Messages
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={conversationData.participant.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {conversationData.participant.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{conversationData.participant.full_name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Active user</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleBlockUser} disabled={isBlocking}>
                      {isBlocking ? "Blocking..." : "Block User"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleReportConversation} disabled={isReporting}>
                      {isReporting ? "Reporting..." : "Report Conversation"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={handleDeleteConversation}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Conversation"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationData.messages.map((message, index) => {
                const showDate =
                  index === 0 ||
                  formatDate(message.created_at) !== formatDate(conversationData.messages[index - 1].created_at)
                const isFromMe = message.sender_id === user?.id

                return (
                    <div key={`${message.id}-${message.created_at}-${index}`}>
                    {showDate && (
                      <div className="text-center text-xs text-muted-foreground my-4">
                        {formatDate(message.created_at)}
                      </div>
                    )}
                    <div className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${isFromMe ? "order-2" : "order-1"}`}>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isFromMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isFromMe ? "justify-end" : "justify-start"}`}>
                          <p className={`text-xs text-muted-foreground`}>{formatTime(message.created_at)}</p>
                          {isFromMe && (
                            <span className="text-xs text-muted-foreground">{message.is_read ? "✓✓" : "✓"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </CardContent>

            <Separator />

            <div className="p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/product/${conversationData.product.id}`} className="block hover:opacity-80">
                <img
                  src={
                    conversationData.product.images?.[0] || "/placeholder.svg?height=128&width=256&query=product-detail"
                  }
                  alt={conversationData.product.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                  loading="lazy"
                  decoding="async"
                />
                <h4 className="font-semibold text-foreground mb-2">{conversationData.product.title}</h4>
                <p className="text-2xl font-bold text-primary mb-2">${conversationData.product.price}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{conversationData.product.condition}</span>
                  <span>{conversationData.product.location}</span>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 mb-4">
                <Avatar>
                  <AvatarImage src={conversationData.participant.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {conversationData.participant.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{conversationData.participant.full_name}</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4 bg-transparent">
                View Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Safety Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>• Meet in a public place</li>
                <li>• Inspect the item before paying</li>
                <li>• Use secure payment methods</li>
                <li>• Trust your instincts</li>
                <li>• Report suspicious activity</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
