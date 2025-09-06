"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MessageSquare } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface UserRatingsProps {
  sellerId: string
  sellerName: string
  sellerAvatar?: string
  productId?: string
  productTitle?: string
}

interface Rating {
  id: string
  rating: number
  review: string
  reviewer_name: string
  reviewer_avatar?: string
  created_at: string
  product_title?: string
}

export function UserRatings({ sellerId, sellerName, sellerAvatar, productId, productTitle }: UserRatingsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)

  const canRate = user && user.id !== sellerId

  const handleRatingSubmit = async () => {
    if (!user || !canRate || rating === 0) {
      toast({
        variant: "destructive",
        title: "Cannot submit rating",
        description: "You must be logged in and cannot rate yourself.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, this would call your ratings API
      const newRating: Rating = {
        id: Date.now().toString(),
        rating,
        review: review.trim(),
        reviewer_name: user.email?.split("@")[0] || "Anonymous",
        created_at: new Date().toISOString(),
        product_title: productTitle,
      }

      setRatings((prev) => [newRating, ...prev])
      setRating(0)
      setReview("")
      setShowReviewForm(false)

      toast({
        title: "Rating submitted!",
        description: "Thank you for your feedback.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit rating. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Seller Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={sellerAvatar || "/placeholder.svg"} />
              <AvatarFallback>{sellerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{sellerName}</h3>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= averageRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({ratings.length} review{ratings.length !== 1 ? "s" : ""})
                </span>
              </div>
            </div>
          </div>

          {canRate && (
            <Button onClick={() => setShowReviewForm(!showReviewForm)} variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Write a Review
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      {showReviewForm && canRate && (
        <Card>
          <CardHeader>
            <CardTitle>Rate this Seller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className="p-1">
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Review (Optional)</label>
              <Textarea
                placeholder="Share your experience with this seller..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRatingSubmit} disabled={rating === 0 || isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Rating"}
              </Button>
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={rating.reviewer_avatar || "/placeholder.svg"} />
                    <AvatarFallback>{rating.reviewer_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{rating.reviewer_name}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= rating.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {rating.product_title && (
                      <p className="text-xs text-muted-foreground mb-1">Product: {rating.product_title}</p>
                    )}
                    {rating.review && <p className="text-sm text-foreground">{rating.review}</p>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
