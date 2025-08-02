// components/ad-management-card.tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Pencil, Trash2, CheckSquare } from "lucide-react"

// Re-using the Ad type from your parent component, which matches Supabase
interface Ad {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category_id: string | null;
  user_id: string;
  images: string[] | null;
  location: string | null;
  condition: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  negotiable?: boolean;
  profiles: {
    full_name: string | null;
  } | null;
}

interface AdManagementCardProps {
  ad: Ad
  onEdit: (ad: Ad) => void
  onMarkAsSold: (adId: string) => void
  onDelete: (adId: string) => void
}

export function AdManagementCard({ ad, onEdit, onMarkAsSold, onDelete }: AdManagementCardProps) {
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
    if (!condition) return "N/A"
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
        <div className="relative">
          <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
            <Image
              src={ad.images?.[0] || "https://placehold.co/400x400/E0E0E0/333333?text=No+Image"}
              alt={ad.title || "Ad image"}
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
                {ad.status === "sold" ? "SOLD" : ad.id.substring(0, 8)}
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
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => onMarkAsSold(ad.id)}>
                    <CheckSquare className="h-3 w-3" />
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
          <div className="space-y-2">
            <h3 className="font-semibold text-base leading-tight line-clamp-2 text-gray-900">{ad.title}</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-blue-600">{formatPrice(ad.price)}</p>
              {ad.negotiable && <span className="text-xs text-gray-500 font-medium">Negotiable</span>}
            </div>
          </div>

          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{ad.location || "Location N/A"}</span>
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