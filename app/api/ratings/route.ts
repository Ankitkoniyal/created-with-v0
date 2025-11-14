// app/api/ratings/route.ts
// API routes for user ratings

import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    // Get all ratings for the user
    const { data: ratings, error } = await supabase
      .from("user_ratings")
      .select(`
        id,
        rating,
        created_at,
        updated_at,
        from_user_id,
        from_user:profiles!from_user_id(id, full_name, avatar_url)
      `)
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false })
    
    if (error) {
      console.error("Error fetching ratings:", error)
      return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 })
    }
    
    // Get rating statistics
    const { data: stats } = await supabase
      .from("user_rating_stats")
      .select("*")
      .eq("to_user_id", userId)
      .single()
    
    // Check if current user has rated this user
    let userRating = null
    if (user) {
      const { data: existingRating } = await supabase
        .from("user_ratings")
        .select("*")
        .eq("from_user_id", user.id)
        .eq("to_user_id", userId)
        .single()
      
      userRating = existingRating
    }
    
    return NextResponse.json({
      ratings: ratings || [],
      stats: stats || {
        total_ratings: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
      },
      userRating,
    })
  } catch (error) {
    console.error("Error in ratings GET:", error)
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
    const { to_user_id, rating } = body
    
    if (!to_user_id || !rating) {
      return NextResponse.json({ error: "User ID and rating are required" }, { status: 400 })
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }
    
    if (to_user_id === user.id) {
      return NextResponse.json({ error: "You cannot rate yourself" }, { status: 400 })
    }
    
    // Upsert rating (update if exists, insert if not)
    const { data, error } = await supabase
      .from("user_ratings")
      .upsert(
        {
          from_user_id: user.id,
          to_user_id,
          rating,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "from_user_id,to_user_id",
        }
      )
      .select()
      .single()
    
    if (error) {
      console.error("Error creating/updating rating:", error)
      return NextResponse.json({ error: "Failed to save rating" }, { status: 500 })
    }
    
    return NextResponse.json({ rating: data }, { status: 201 })
  } catch (error) {
    console.error("Error in ratings POST:", error)
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
    const toUserId = searchParams.get("toUserId")
    
    if (!toUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    const { error } = await supabase
      .from("user_ratings")
      .delete()
      .eq("from_user_id", user.id)
      .eq("to_user_id", toUserId)
    
    if (error) {
      console.error("Error deleting rating:", error)
      return NextResponse.json({ error: "Failed to delete rating" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in ratings DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

