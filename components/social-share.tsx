"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, MessageCircle, Facebook, Instagram, Send, Twitter, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SocialShareProps {
  title: string
  description: string
  url?: string
  price?: number | null
  imageUrl?: string
}

export function SocialShare({ title, description, url, price, imageUrl }: SocialShareProps) {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "")
  const shareText = `${title}\n\n${description}${price ? `\n\nPrice: ₹${price.toLocaleString()}` : ""}\n\nCheck it out:`
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    instagram: `https://www.instagram.com/`, // Instagram doesn't support direct sharing via URL
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`,
  }

  const handleShare = (platform: string) => {
    if (platform === "instagram") {
      // For Instagram, copy link to clipboard since direct sharing isn't supported
      navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied",
        description: "Link copied to clipboard. You can now share it on Instagram!",
      })
      return
    }

    const link = shareLinks[platform as keyof typeof shareLinks]
    if (link) {
      window.open(link, "_blank", "width=600,height=400")
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link Copied",
      description: "Ad link copied to clipboard",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5" />
          Share This Ad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("whatsapp")}
            className="flex items-center gap-2 hover:bg-green-50 hover:border-green-500 hover:text-green-600"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("facebook")}
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
          >
            <Facebook className="h-4 w-4" />
            Facebook
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("instagram")}
            className="flex items-center gap-2 hover:bg-pink-50 hover:border-pink-500 hover:text-pink-600"
          >
            <Instagram className="h-4 w-4" />
            Instagram
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("telegram")}
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
          >
            <Send className="h-4 w-4" />
            Telegram
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("twitter")}
            className="flex items-center gap-2 hover:bg-gray-50 hover:border-gray-500 hover:text-gray-600"
          >
            <Twitter className="h-4 w-4" />X (Twitter)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("email")}
            className="flex items-center gap-2 hover:bg-gray-50 hover:border-gray-500 hover:text-gray-600"
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button variant="secondary" size="sm" onClick={handleCopyLink} className="w-full">
            Copy Link
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
