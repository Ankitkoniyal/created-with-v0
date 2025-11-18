import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  totalRatings?: number
  size?: "sm" | "md" | "lg"
  showCount?: boolean
  className?: string
}

export function StarRating({ 
  rating, 
  totalRatings, 
  size = "sm",
  showCount = false,
  className 
}: StarRatingProps) {
  if (!rating || rating <= 0) {
    return null
  }

  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5 && rating < 5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")}
        />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star
            className={cn(sizeClasses[size], "text-gray-300")}
          />
          <Star
            className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400 absolute left-0 top-0 overflow-hidden")}
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={cn(sizeClasses[size], "text-gray-300")}
        />
      ))}
      {rating > 0 && (
        <span className={cn("ml-1 text-gray-600 font-medium", textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {showCount && totalRatings !== undefined && totalRatings > 0 && (
        <span className={cn("ml-1 text-gray-500", textSizeClasses[size])}>
          ({totalRatings})
        </span>
      )}
    </div>
  )
}

