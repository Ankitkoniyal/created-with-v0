// app/api/comments/route.ts
// API routes for user comments

import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    // Get comments for the user with pagination
    const { data: comments, error } = await supabase
      .from("user_comments")
      .select(`
        id,
        comment_text,
        created_at,
        updated_at,
        from_user_id,
        from_user:profiles!from_user_id(id, full_name, avatar_url)
      `)
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error("Error fetching comments:", error)
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }
    
    // Get total count
    const { count } = await supabase
      .from("user_comments")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", userId)
    
    return NextResponse.json({
      comments: comments || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error in comments GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { to_user_id, comment_text } = body
    
    if (!to_user_id || !comment_text) {
      return NextResponse.json({ error: "User ID and comment text are required" }, { status: 400 })
    }
    
    if (comment_text.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
    }
    
    if (comment_text.length > 2000) {
      return NextResponse.json({ error: "Comment cannot exceed 2000 characters" }, { status: 400 })
    }
    
    if (to_user_id === user.id) {
      return NextResponse.json({ error: "You cannot comment on yourself" }, { status: 400 })
    }
    
    // Create comment
    const { data, error } = await supabase
      .from("user_comments")
      .insert({
        from_user_id: user.id,
        to_user_id,
        comment_text: comment_text.trim(),
      })
      .select(`
        id,
        comment_text,
        created_at,
        updated_at,
        from_user_id,
        from_user:profiles!from_user_id(id, full_name, avatar_url)
      `)
      .single()
    
    if (error) {
      console.error("Error creating comment:", error)
      return NextResponse.json({ error: "Failed to save comment" }, { status: 500 })
    }
    
    return NextResponse.json({ comment: data }, { status: 201 })
  } catch (error) {
    console.error("Error in comments POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get("commentId")
    
    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }
    
    const { error } = await supabase
      .from("user_comments")
      .delete()
      .eq("id", commentId)
      .eq("from_user_id", user.id)
    
    if (error) {
      console.error("Error deleting comment:", error)
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in comments DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { commentId, comment_text } = body
    
    if (!commentId || !comment_text) {
      return NextResponse.json({ error: "Comment ID and text are required" }, { status: 400 })
    }
    
    if (comment_text.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
    }
    
    if (comment_text.length > 2000) {
      return NextResponse.json({ error: "Comment cannot exceed 2000 characters" }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from("user_comments")
      .update({ comment_text: comment_text.trim() })
      .eq("id", commentId)
      .eq("from_user_id", user.id)
      .select(`
        id,
        comment_text,
        created_at,
        updated_at,
        from_user_id,
        from_user:profiles!from_user_id(id, full_name, avatar_url)
      `)
      .single()
    
    if (error) {
      console.error("Error updating comment:", error)
      return NextResponse.json({ error: "Failed to update comment" }, { status: 500 })
    }
    
    return NextResponse.json({ comment: data })
  } catch (error) {
    console.error("Error in comments PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

