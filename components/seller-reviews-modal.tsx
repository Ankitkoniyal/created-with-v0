"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, X } from "lucide-react"

interface Review {
  id: string
  reviewer: string
  rating: number
  comment: string
  date: string
}

interface Seller {
  name: string
  rating: number
  totalReviews: number
  reviews?: Review[]
}

interface SellerReviewsModalProps {
  isOpen: boolean
  onClose: () => void
  seller: Seller
}

export function SellerReviewsModal({ isOpen, onClose, seller }: SellerReviewsModalProps) {
  // Sample reviews data - in a real app, this would come from your database
  const sampleReviews: Review[] = [
    {
      id: "1",
      reviewer: "John Doe",
      rating: 5,
      comment: "Great seller! The item was exactly as described and shipping was fast.",
      date: "2023-10-15"
    },
    {
      id: "2",
      reviewer: "Jane Smith",
      rating: 4,
      comment: "Good communication and item was as described. Would buy from again.",
      date: "2023-09-22"
    },
    {
      id: "3",
      reviewer: "Mike Johnson",
      rating: 5,
      comment: "Excellent seller! Very professional and item was packaged carefully.",
      date: "2023-08-05"
    }
  ]

  const reviews = seller.reviews || sampleReviews

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Reviews for {seller.name}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-4xl font-bold">{seller.rating}</div>
              <div className="flex items-center justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(seller.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {seller.totalReviews} reviews
              </div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviews.filter(r => Math.round(r.rating) === rating).length
                const percentage = (count / reviews.length) * 100
                
                return (
                  <div key={rating} className="flex items-center space-x-2 text-sm">
                    <span className="w-4">{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-yellow-400 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{review.reviewer}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(review.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}