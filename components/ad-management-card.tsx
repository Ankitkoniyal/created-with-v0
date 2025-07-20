"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Edit, Trash2, CheckCircle, Eye } from "lucide-react"
import type { Ad } from "@/lib/mock-data"
import { mockUsers } from "@/lib/mock-data"

interface AdManagementCardProps {
  ad: Ad
  onEdit: (ad: Ad) => void
  onMarkAsSold: (adId: string) => void
  onDelete: (adId: string) => void
}

export function AdManagementCard({ ad, onEdit, onMarkAsSold, onDelete }: AdManagementCardProps) {
  const seller = mockUsers.find((user) => user.id === ad.user_id)

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

  const formatCondition = (condition: string) => {
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
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white relative">
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative">
          <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
            <Image
              src={ad.images?.[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop"}
              alt={ad.title}
              fill
              className="object-cover"
            />

            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <Badge
                variant="outline"
                className={`backdrop-blur-sm text-xs font-mono border-0 shadow-sm ${
                  ad.status === "sold" ? "bg-green-500/90 text-white" : "bg-white/95"
                }`}
              >
                {ad.status === "sold" ? "SOLD" : ad.adId}
              </Badge>
            </div>

            {/* Condition Badge */}
            <div className="absolute top-3 right-3">
              {ad.condition && (
                <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-0 text-xs font-medium">
                  {formatCondition(ad.condition)}
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0" asChild>
                <Link href={`/ad/${ad.id}`}>
                  <Eye className="h-3 w-3" />
                </Link>
              </Button>
              {ad.status === "active" && (
                <>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => onEdit(ad)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => onMarkAsSold(ad.id)}>
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                </>
              )}
              <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => onDelete(ad.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Title and Price */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base leading-tight line-clamp-2 text-gray-900">{ad.title}</h3>

            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-blue-600">{formatPrice(ad.price)}</p>
              {ad.negotiable && <span className="text-xs text-gray-500 font-medium">Negotiable</span>}
            </div>
          </div>

          {/* Location and Date */}
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {ad.city}, {ad.state}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>{formatDate(ad.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
