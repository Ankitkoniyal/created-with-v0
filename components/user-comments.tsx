// components/user-comments.tsx
// Component for displaying and adding user comments

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Loader2, Trash2, Edit2, X, Check } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Comment {
  id: string
  comment_text: string
  created_at: string
  updated_at: string
  from_user: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

interface UserCommentsProps {
  userId: string
  showAddComment?: boolean
  limit?: number
}

export function UserComments({ userId, showAddComment = true, limit = 10 }: UserCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?userId=${userId}&limit=${limit}&offset=${offset}`)
      if (!response.ok) throw new Error("Failed to fetch comments")
      
      const data = await response.json()
      if (offset === 0) {
        setComments(data.comments || [])
      } else {
        setComments((prev) => [...prev, ...(data.comments || [])])
      }
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast.error("Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setOffset(0)
    setComments([])
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchComments()
    }
  }, [userId, offset])

  const handleCommentSubmit = async () => {
    if (!user) {
      toast.error("Please login to add comments")
      return
    }

    if (!commentText.trim()) {
      toast.error("Comment cannot be empty")
      return
    }

    if (commentText.length > 2000) {
      toast.error("Comment cannot exceed 2000 characters")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_user_id: userId,
          comment_text: commentText.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save comment")
      }

      toast.success("Comment added successfully")
      setCommentText("")
      setShowCommentDialog(false)
      setOffset(0)
      fetchComments()
    } catch (error: any) {
      console.error("Error submitting comment:", error)
      toast.error(error.message || "Failed to save comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    if (!confirm("Are you sure you want to delete this comment?")) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete comment")

      toast.success("Comment deleted successfully")
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setTotal((prev) => prev - 1)
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) {
      toast.error("Comment cannot be empty")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          comment_text: editText.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update comment")
      }

      const data = await response.json()
      setComments((prev) => prev.map((c) => (c.id === commentId ? data.comment : c)))
      setEditingId(null)
      setEditText("")
      toast.success("Comment updated successfully")
    } catch (error: any) {
      console.error("Error updating comment:", error)
      toast.error(error.message || "Failed to update comment")
    } finally {
      setSubmitting(false)
    }
  }

  const canComment = user && user.id !== userId && showAddComment

  if (loading && offset === 0) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({total})
          </CardTitle>
          {canComment && (
            <Button onClick={() => setShowCommentDialog(true)} variant="outline" size="sm">
              Add Comment
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No comments yet</p>
            {canComment && (
              <Button onClick={() => setShowCommentDialog(true)} variant="outline" className="mt-4">
                Be the first to comment
              </Button>
            )}
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.from_user.avatar_url} />
                    <AvatarFallback>
                      {comment.from_user.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{comment.from_user.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                      {comment.updated_at !== comment.created_at && (
                        <Badge variant="outline" className="text-xs">Edited</Badge>
                      )}
                      {user && user.id === comment.from_user.id && (
                        <div className="flex gap-2 ml-auto">
                          {editingId === comment.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditComment(comment.id)}
                                disabled={submitting}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(null)
                                  setEditText("")
                                }}
                                disabled={submitting}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(comment.id)
                                  setEditText(comment.comment_text)
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={submitting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {editingId === comment.id ? (
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="mt-2"
                        rows={3}
                        maxLength={2000}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {comments.length < total && (
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => setOffset((prev) => prev + limit)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${total - comments.length} remaining)`
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Add Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Comment</DialogTitle>
            <DialogDescription>Share your experience with this user</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment here..."
              rows={5}
              maxLength={2000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {commentText.length}/2000 characters
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCommentSubmit} disabled={!commentText.trim() || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Comment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

