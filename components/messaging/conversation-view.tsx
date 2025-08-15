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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversationData?.messages])

  useEffect(() => {
    const fetchConversation = async () => {
      if (!user) return

      try {
        const supabase = createClient()

        // Parse conversation ID (format: productId-participantId)
        const [productId, participantId] = conversationId.split("-")

        const { data: messages, error: messagesError } = await supabase
          .from("messages")
          .select(`
            id,
            message,
            created_at,
            sender_id,
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
          console.log("[v0] Fetched conversation data:", { messages, product, participant })
          setConversationData({
            product,
            participant,
            messages: messages || [],
          })
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()
  }, [conversationId, user])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !conversationData) return

    try {
      const supabase = createClient()
      const [productId, participantId] = conversationId.split("-")

      const { data, error } = await supabase
        .from("messages")
        .insert({
          product_id: productId,
          sender_id: user.id,
          receiver_id: participantId,
          message: newMessage.trim(),
        })
        .select(`
          id,
          message,
          created_at,
          sender_id,
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
        console.log("[v0] Message sent:", data)
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
            <p className="text-muted-foreground">This conversation may have been deleted or doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/messages">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Messages
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            {/* Chat Header */}
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
                    <DropdownMenuItem>Block User</DropdownMenuItem>
                    <DropdownMenuItem>Report Conversation</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete Conversation</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <Separator />

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationData.messages.map((message, index) => {
                const showDate =
                  index === 0 ||
                  formatDate(message.created_at) !== formatDate(conversationData.messages[index - 1].created_at)
                const isFromMe = message.sender_id === user?.id

                return (
                  <div key={message.id}>
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
                        <p className={`text-xs text-muted-foreground mt-1 ${isFromMe ? "text-right" : "text-left"}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </CardContent>

            <Separator />

            {/* Message Input */}
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

        {/* Product Info & Seller Details */}
        <div className="space-y-6">
          {/* Product Card */}
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
                  src={conversationData.product.images?.[0] || "/placeholder.svg"}
                  alt={conversationData.product.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
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

          {/* Seller Info */}
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

          {/* Safety Tips */}
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
