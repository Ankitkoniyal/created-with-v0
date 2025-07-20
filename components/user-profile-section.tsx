"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star, MessageCircle, Calendar, Eye, Phone } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getReviewsForUser, saveReviewToStorage, calculateUserRating } from "@/lib/mock-data"
import { toast } from "@/hooks/use-toast"
import type { User } from "@/lib/mock-data"

interface UserProfileSectionProps {
  user: User
  onMessageClick: () => void
  onViewAllListings?: () => void
  showViewAllButton?: boolean
}

export function UserProfileSection({
  user,
  onMessageClick,
  onViewAllListings,
  showViewAllButton = false,
}: UserProfileSectionProps) {
  const { user: currentUser } = useAuth()
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  const formatMemberSince = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
    })
  }

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${interactive ? "cursor-pointer" : ""} ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
              ? "fill-yellow-400/50 text-yellow-400"
              : "text-gray-300"
        }`}
        onClick={interactive && onStarClick ? () => onStarClick(i + 1) : undefined}
      />
    ))
  }

  const handleSubmitReview = async () => {
    if (!currentUser || !reviewComment.trim()) {
      toast({
        title: "Error",
        description: "Please write a review comment",
        variant: "destructive",
      })
      return
    }

    setSubmittingReview(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newReview = {
      id: Date.now().toString(),
      reviewer_id: currentUser.id,
      reviewed_user_id: user.id,
      rating: reviewRating,
      comment: reviewComment,
      created_at: new Date().toISOString(),
    }

    saveReviewToStorage(newReview)

    toast({
      title: "Success",
      description: "Review submitted successfully!",
    })

    setShowReviewDialog(false)
    setReviewComment("")
    setReviewRating(5)
    setSubmittingReview(false)
  }

  const userReviews = getReviewsForUser(user.id)
  const { rating, total_ratings } = calculateUserRating(user.id)

  // Check if current user can rate this seller (must be signed in and not rating themselves)
  const canRate = currentUser && currentUser.id !== user.id

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Seller Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Image and Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Image
                src={user.avatar_url || "/placeholder.svg?height=60&width=60"}
                alt={user.full_name}
                width={60}
                height={60}
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{user.full_name}</h3>
              <div className="flex items-center gap-1 mt-1">
                {renderStars(rating)}
                <span className="text-sm text-gray-600 ml-1">({total_ratings} reviews)</span>
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Member since {formatMemberSince(user.member_since)}</span>
          </div>

          {/* Rating Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ⭐ {rating.toFixed(1)} Rating
            </Badge>
            <Badge variant="outline">{total_ratings} Reviews</Badge>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button onClick={onMessageClick} className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>

            <Button variant="outline" className="w-full bg-transparent">
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>

            {canRate && (
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowReviewDialog(true)}>
                <Star className="h-4 w-4 mr-2" />
                Rate Seller
              </Button>
            )}

            {showViewAllButton && (
              <Button variant="outline" className="w-full bg-transparent" onClick={onViewAllListings}>
                View All Listings
              </Button>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              ✓ Verified Phone Number
              <br />✓ Active Seller
              <br />✓ Quick Response
            </p>
          </div>

          {/* Recent Reviews */}
          {userReviews.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-3">Recent Reviews</h4>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {userReviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      {renderStars(review.rating)}
                      <span className="text-gray-500 ml-1">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{review.comment}</p>
                  </div>
                ))}
              </div>
              {userReviews.length > 3 && (
                <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-2">
                  View all {userReviews.length} reviews
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate {user.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rating</label>
              <div className="flex items-center gap-1 mt-1">
                {renderStars(reviewRating, true, setReviewRating)}
                <span className="ml-2 text-sm text-gray-600">({reviewRating} stars)</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Review</label>
              <Textarea
                placeholder="Share your experience with this seller..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmitReview} disabled={submittingReview} className="flex-1">
                {submittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
