// components/ad-card.tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, User } from "lucide-react"

// Update the Ad type to include the seller's name from the join
interface Ad {
  id: string;
  title: string;
  price: number | null;
  user_id: string;
  images: string[] | null;
  location: string | null;
  condition: string | null;
  created_at: string;
  negotiable?: boolean;
  profiles: { full_name: string | null } | null;
}

interface AdCardProps {
  ad: Ad
}

export function AdCard({ ad }: AdCardProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const formatCondition = (condition: string | null) => {
    if (!condition) return "N/A";
    switch (condition) {
      case "second_hand":
        return "Second Hand"
      case "like_new":
        return "Like New"
      case "new":
        return "New"
      default:
        return condition
    }
  }

  return (
    <Link href={`/ad/${ad.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="aspect-square relative">
            <Image
              src={ad.images?.[0] || "https://placehold.co/400x400/E0E0E0/333333?text=No+Image"}
              alt={ad.title || "Ad image"}
              fill
              className="object-cover rounded-t-lg"
            />
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {ad.condition && (
                <Badge className="bg-green-500 capitalize text-xs">{formatCondition(ad.condition)}</Badge>
              )}
              {ad.negotiable && (
                <Badge variant="secondary" className="text-xs">
                  Negotiable
                </Badge>
              )}
            </div>
            <div className="absolute top-2 left-2">
              <Badge variant="outline" className="bg-white/90 text-xs font-mono">
                {ad.id.substring(0, 8)}...
              </Badge>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 min-h-[56px]">{ad.title}</h3>
            <p className="text-2xl font-bold text-blue-600 mb-3">
              {formatPrice(ad.price)}
              {ad.negotiable && <span className="text-sm font-normal text-gray-500 ml-1">Negotiable</span>}
            </p>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <User className="h-4 w-4 mr-1" />
              <span className="font-medium">
                {ad.profiles?.full_name || "Anonymous"}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">
                {ad.location || "Location N/A"}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {formatDate(ad.created_at)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}