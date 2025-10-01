"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Shield, Star, AlertTriangle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ContactSellerModalProps {
  product: {
    id: string
    title: string
    price: string
    image: string
  }
  seller: {
    name: string
    avatar?: string
    verified: boolean
    rating: number
    totalReviews: number
  }
  children: React.ReactNode
}

export function ContactSellerModal({ product, seller, children }: ContactSellerModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [message, setMessage] = useState(`Hi! I'm interested in your ${product.title}. Is it still available?`)
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleSendMessage = async () => {
    if (!user) {
    // REDIRECT TO LOGIN WITH RETURN URL
    const redirectedFrom = `${window.location.pathname}${window.location.search}`
    router.push(`/auth/login?redirectedFrom=${encodeURIComponent(redirectedFrom)}`)
    setIsOpen(false) // Close the modal
    return
  }

    setIsSending(true)

    try {
      const supabase = createClient()

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", product.id)
        .single()

      if (productError) {
        console.error("Error fetching product:", productError)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to send message. Please try again.",
        })
        return
      }

      if (productData?.user_id === user.id) {
        toast({
          variant: "destructive",
          title: "Cannot message your own listing",
          description: "You cannot start a conversation with yourself.",
        })
        return
      }

      // Block check (either direction)
      const { data: blockCheck, error: blockErr } = await supabase
        .from("blocked_users")
        .select("id")
        .or(
          `and(blocker_id.eq.${user.id},blocked_id.eq.${productData.user_id}),and(blocker_id.eq.${productData.user_id},blocked_id.eq.${user.id})`,
        )
        .limit(1)

      if (!blockErr && blockCheck && blockCheck.length > 0) {
        toast({
          variant: "destructive",
          title: "Messaging unavailable",
          description: "Messaging is disabled because one of the users has been blocked.",
        })
        return
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          product_id: product.id,
          sender_id: user.id,
          receiver_id: productData.user_id,
          message: message.trim(),
          is_read: false,
        })
        .select()
        .single()

      if (error) {
        console.error("Error sending message:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to send message. Please try again.",
        })
      } else {
        toast({
          title: "Message sent!",
          description: "Your message has been sent to the seller.",
        })
        setIsOpen(false)

        const conversationId = `${product.id}-${productData.user_id}`
        router.push(`/dashboard/messages/${conversationId}`)
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please check your connection and try again.",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Contact Seller
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              <strong>Safety Reminder:</strong> Meet in public places and inspect items before payment.
            </p>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
            <img
              src={product.image || "/placeholder.svg?height=48&width=48&query=product-thumb"}
              alt={product.title}
              className="w-12 h-12 object-cover rounded"
              loading="lazy"
              decoding="async"
            />
            <div className="flex-1">
              <h4 className="font-medium text-sm">{product.title}</h4>
              <p className="text-primary font-bold">{product.price}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={seller.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {seller.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{seller.name}</span>
                {seller.verified && (
                  <Badge variant="secondary" className="flex items-center text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{seller.rating}</span>
                <span>({seller.totalReviews} reviews)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              placeholder="Ask about the product, condition, availability, etc."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={!message.trim() || isSending} className="flex-1">
              {isSending ? "Sending..." : "Send Message"}
            </Button>
          </div>

          {!user && (
            <p className="text-xs text-muted-foreground text-center">You need to be logged in to contact sellers</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
