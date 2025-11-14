// components/user-ratings.tsx
// Component for displaying and adding user ratings

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Rating {
  id: string
  rating: number
  created_at: string
  updated_at: string
  from_user: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

interface RatingStats {
  total_ratings: number
  average_rating: number
  five_star: number
  four_star: number
  three_star: number
  two_star: number
  one_star: number
}

interface UserRating {
  id: string
  rating: number
  from_user_id: string
  to_user_id: string
}

interface UserRatingsProps {
  userId: string
  showAddRating?: boolean
}

export function UserRatings({ userId, showAddRating = true }: UserRatingsProps) {
  const { user } = useAuth()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [userRating, setUserRating] = useState<UserRating | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const [showRatingDialog, setShowRatingDialog] = useState(false)

  const fetchRatings = async () => {
    try {
      const response = await fetch(`/api/ratings?userId=${userId}`)
      if (!response.ok) throw new Error("Failed to fetch ratings")
      
      const data = await response.json()
      setRatings(data.ratings || [])
      setStats(data.stats || null)
      setUserRating(data.userRating || null)
      if (data.userRating) {
        setSelectedRating(data.userRating.rating)
      }
    } catch (error) {
      console.error("Error fetching ratings:", error)
      toast.error("Failed to load ratings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRatings()
  }, [userId])

  const handleRatingSubmit = async () => {
    if (!user) {
      toast.error("Please login to rate users")
      return
    }

    if (selectedRating === 0) {
      toast.error("Please select a rating")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_user_id: userId,
          rating: selectedRating,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save rating")
      }

      toast.success(userRating ? "Rating updated successfully" : "Rating added successfully")
      setShowRatingDialog(false)
      fetchRatings()
    } catch (error: any) {
      console.error("Error submitting rating:", error)
      toast.error(error.message || "Failed to save rating")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRating = async () => {
    if (!user || !userRating) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/ratings?toUserId=${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete rating")

      toast.success("Rating deleted successfully")
      setUserRating(null)
      setSelectedRating(0)
      fetchRatings()
    } catch (error) {
      console.error("Error deleting rating:", error)
      toast.error("Failed to delete rating")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const canRate = user && user.id !== userId && showAddRating

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Ratings & Reviews
          </CardTitle>
          {canRate && (
            <Button onClick={() => setShowRatingDialog(true)} variant="outline" size="sm">
              {userRating ? "Update Rating" : "Add Rating"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        {stats && stats.total_ratings > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{stats.average_rating.toFixed(1)}</div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(stats.average_rating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.total_ratings} {stats.total_ratings === 1 ? "rating" : "ratings"}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats[`${star}_star` as keyof RatingStats] as number
                  const percentage = stats.total_ratings > 0 ? (count / stats.total_ratings) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm w-16">{star} star</span>
                      <Progress value={percentage} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No ratings yet</p>
            {canRate && (
              <Button onClick={() => setShowRatingDialog(true)} variant="outline" className="mt-4">
                Be the first to rate
              </Button>
            )}
          </div>
        )}

        {/* User's Rating */}
        {userRating && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Your Rating</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= userRating.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleDeleteRating} variant="ghost" size="sm" disabled={submitting}>
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* Recent Ratings */}
        {ratings.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-medium">Recent Ratings</h3>
            {ratings.slice(0, 5).map((rating) => (
              <div key={rating.id} className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={rating.from_user.avatar_url} />
                  <AvatarFallback>
                    {rating.from_user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{rating.from_user.full_name}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= rating.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {ratings.length > 5 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                Showing 5 of {ratings.length} ratings
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{userRating ? "Update Your Rating" : "Rate This User"}</DialogTitle>
            <DialogDescription>Select a rating from 1 to 5 stars</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-12 w-12 ${
                      star <= selectedRating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {selectedRating > 0 && (
              <p className="text-center mt-4 text-sm text-muted-foreground">
                You selected {selectedRating} {selectedRating === 1 ? "star" : "stars"}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRatingSubmit} disabled={selectedRating === 0 || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                userRating ? "Update Rating" : "Submit Rating"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

