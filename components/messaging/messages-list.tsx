"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageSquare, Package, CheckCircle, MoreVertical, Trash2, Flag, Ban, EyeOff } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set())

 const fetchBlockedUsers = async (): Promise<Set<string>> => {
  if (!user) return new Set<string>()
  
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("blocked_users")
      .select("blocked_user_id", { count: "exact" })
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching blocked users:", error)
      return new Set<string>()
    }
    
    return new Set(data?.map(item => item.blocked_user_id) || [])
  } catch (error) {
    console.error("Unexpected error in fetchBlockedUsers:", error)
    return new Set<string>()
  }
}

  const fetchConversations = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const blockedUsersSet = await fetchBlockedUsers()
      setBlockedUsers(blockedUsersSet)

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
        toast.error("Failed to load conversations")
      } else {
        const conversationMap = new Map<string, any>()

        data?.forEach((message: any) => {
          const otherParticipant = message.sender_id === user.id ? message.receiver : message.sender
          const conversationKey = `${message.product_id}-${otherParticipant.id}`

          // Skip if user has blocked this participant
          if (blockedUsersSet.has(otherParticipant.id)) return

          const isUnreadForMe = message.receiver_id === user.id && 
                               message.sender_id === otherParticipant.id && 
                               message.is_read === false

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
            if (isUnreadForMe) existing.unread_count += 1
            if (new Date(message.created_at) > new Date(existing.latest_message.created_at)) {
              existing.latest_message = {
                message: message.message,
                created_at: message.created_at,
                sender_id: message.sender_id,
              }
            }
          }
        })

        setConversations(Array.from(conversationMap.values()))
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    if (!user) return

    const supabase = createClient()
    const channel = supabase
      .channel("messages_list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { sender_id?: string; receiver_id?: string } | null
          if (!row) return
          if (row.sender_id === user.id || row.receiver_id === user.id) {
            fetchConversations()
            window.dispatchEvent(new CustomEvent("messagesUpdated"))
          }
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe().catch(() => {})
      supabase.removeChannel(channel)
    }
  }, [user])

  // Delete conversation - FIXED
  const deleteConversation = async (conversationId: string) => {
  if (!user) return
  const confirmDelete = window.confirm("Are you sure you want to delete this conversation? This action cannot be undone.")
  if (!confirmDelete) return

    setDeletingId(conversationId)
    try {
      const supabase = createClient()
      const [productId, participantId] = conversationId.split('-')
      
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("product_id", productId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`)

      if (error) {
        console.error("Delete conversation error:", error)
        throw error
      }

      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      window.dispatchEvent(new CustomEvent('messagesUpdated'))
      toast.success("Conversation deleted successfully")
    } catch (error) {
      console.error("Error deleting conversation:", error)
      toast.error("Failed to delete conversation. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  // Block user functionality - FIXED
  const blockUser = async (userId: string, userName: string) => {
    if (!user) return
    const confirmBlock = window.confirm(`Are you sure you want to block ${userName}? You will no longer receive messages from them.`)
    if (!confirmBlock) return

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("blocked_users")
        .insert({ 
          user_id: user.id, 
          blocked_user_id: userId,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error("Block user error:", error)
        
        // If table doesn't exist, show user-friendly message
        if (error.code === '42P01') {
          toast.error("Block feature is currently being set up. Please try again later.")
          return
        }
        
        // If unique constraint violation, user is already blocked
        if (error.code === '23505') {
          toast.success(`${userName} is already blocked`)
          return
        }
        
        throw error
      }

      setBlockedUsers(prev => new Set(prev).add(userId))
      await fetchConversations()
      toast.success(`You have blocked ${userName}`)
    } catch (error) {
      console.error("Error blocking user:", error)
      toast.error("Failed to block user. Please try again.")
    }
  }

  // Report conversation - FIXED
  const reportConversation = async (conversationId: string, participantName: string, participantId: string) => {
    if (!user) return
    const reason = window.prompt(`Why are you reporting this conversation with ${participantName}?`)
    if (!reason) return

    try {
      const supabase = createClient()
      const [productId, _] = conversationId.split('-')
      
      const { error } = await supabase
        .from("reports")
        .insert({
          product_id: productId,
          user_id: participantId,
          reporter_id: user.id,
          reason: reason,
          details: `Conversation Report - Conversation ID: ${conversationId}`,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error("Report conversation error:", error)
        
        if (error.code === '42P01') {
          toast.error("Report feature is currently being set up. Please try again later.")
          return
        }
        
        throw error
      }

      toast.success("Thank you for your report. We will review this conversation.")
    } catch (error) {
      console.error("Error reporting conversation:", error)
      toast.error("Failed to report conversation. Please try again.")
    }
  }

  // Mark conversation as read
  const markConversationAsRead = async (conversationId: string) => {
    if (!user) return
    try {
      const supabase = createClient()
      const [productId, participantId] = conversationId.split('-')
      
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("product_id", productId)
        .eq("receiver_id", user.id)
        .eq("sender_id", participantId)
        .eq("is_read", false)

      if (error) throw error

      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      ))
      window.dispatchEvent(new CustomEvent('messagesUpdated'))
    } catch (error) {
      console.error("Error marking conversation as read:", error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false)

      if (error) throw error

      setConversations(prev => prev.map(conv => ({ ...conv, unread_count: 0 })))
      window.dispatchEvent(new CustomEvent('messagesUpdated'))
      toast.success("All conversations marked as read")
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("Failed to mark all as read")
    }
  }

  // Filter conversations
  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch = conversation.participant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.products?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === "all" ||
                         (filter === "unread" && conversation.unread_count > 0) ||
                         (filter === "active" && conversation.products?.status === "active") ||
                         (filter === "sold" && conversation.products?.status === "sold")
    return matchesSearch && matchesFilter
  })

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    return (now.getTime() - date.getTime()) < 24 * 60 * 60 * 1000 
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString()
  }

  if (loading) {
    return <div className="flex justify-center items-center py-12"><div className="text-center"><MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" /><p className="text-muted-foreground">Loading conversations...</p></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Conversations</h2>
          <p className="text-muted-foreground">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {totalUnread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "unread", "active", "sold"].map((filt) => (
            <Button key={filt} variant={filter === filt ? "default" : "outline"} size="sm" onClick={() => setFilter(filt as any)}>
              {filt === "unread" ? `Unread ${totalUnread > 0 ? <Badge className="ml-1">{totalUnread}</Badge> : ""}` : filt.charAt(0).toUpperCase() + filt.slice(1)}
            </Button>
          ))}
        </div>
      </div></CardContent></Card>

      {/* Conversations List */}
      <div className="space-y-2">
        {filteredConversations.length === 0 ? (
          <Card><CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No conversations found</h3>
            <p className="text-muted-foreground">{searchTerm ? "Try adjusting your search terms" : "Start selling to receive messages from buyers"}</p>
          </CardContent></Card>
        ) : (
          filteredConversations.map((conversation) => (
            <div key={conversation.id} className="relative group">
              <Link href={`/dashboard/messages/${conversation.id}`}>
                <Card className={`hover:shadow-md transition-shadow cursor-pointer ${conversation.unread_count > 0 ? 'border-l-4 border-l-primary' : ''}`}
                  onClick={() => conversation.unread_count > 0 && markConversationAsRead(conversation.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 flex-shrink-0">
                        <img src={conversation.products?.images?.[0] || "/placeholder.svg"} alt={conversation.products?.title || "Product"} className="w-full h-full object-cover rounded-lg"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6"><AvatarImage src={conversation.participant?.avatar_url} /><AvatarFallback className="text-xs">{conversation.participant?.full_name?.split(" ").map((n) => n[0]).join("") || "U"}</AvatarFallback></Avatar>
                            <span className="font-medium text-foreground">{conversation.participant?.full_name || "Unknown User"}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">{formatTime(conversation.latest_message?.created_at)}</span>
                            {conversation.unread_count > 0 && <Badge className="bg-primary text-primary-foreground">{conversation.unread_count}</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground truncate">{conversation.products?.title}</span>
                          <span className="text-sm font-medium text-primary">${conversation.products?.price}</span>
                        </div>
                        <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {conversation.latest_message?.sender_id === user?.id ? "You: " : ""}{conversation.latest_message?.message}
                        </p>
                      </div>
                      <Badge variant={conversation.products?.status === "active" ? "default" : "secondary"}>{conversation.products?.status || "unknown"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              {/* Action Menu */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border border-gray-200 rounded-lg shadow-lg">
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); markConversationAsRead(conversation.id) }} className="flex items-center gap-2 cursor-pointer"><CheckCircle className="h-4 w-4" />Mark as Read</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteConversation(conversation.id) }} disabled={deletingId === conversation.id} className="flex items-center gap-2 cursor-pointer text-red-600"><Trash2 className="h-4 w-4" />{deletingId === conversation.id ? "Deleting..." : "Delete Conversation"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); blockUser(conversation.participant.id, conversation.participant.full_name) }} className="flex items-center gap-2 cursor-pointer"><Ban className="h-4 w-4" />Block User</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); reportConversation(conversation.id, conversation.participant.full_name, conversation.participant.id) }} className="flex items-center gap-2 cursor-pointer"><Flag className="h-4 w-4" />Report Conversation</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
