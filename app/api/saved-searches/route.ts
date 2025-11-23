import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: searches, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching saved searches:", error)
      return NextResponse.json({ error: "Failed to fetch saved searches" }, { status: 500 })
    }

    return NextResponse.json({ searches: searches || [] })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, search_query, category, subcategory, location, province, city, min_price, max_price, condition, filters, email_alerts } = body

    if (!name || (!search_query && !category)) {
      return NextResponse.json({ error: "Name and at least one search criteria required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: user.id,
        name,
        search_query: search_query || null,
        category: category || null,
        subcategory: subcategory || null,
        location: location || null,
        province: province || null,
        city: city || null,
        min_price: min_price || null,
        max_price: max_price || null,
        condition: condition || null,
        filters: filters || {},
        email_alerts: email_alerts !== undefined ? email_alerts : true,
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate search error
      if (error.code === '23505') {
        return NextResponse.json({ error: "This search is already saved" }, { status: 409 })
      }
      console.error("Error saving search:", error)
      return NextResponse.json({ error: "Failed to save search" }, { status: 500 })
    }

    return NextResponse.json({ search: data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Search ID required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting saved search:", error)
      return NextResponse.json({ error: "Failed to delete search" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Search ID required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("saved_searches")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating saved search:", error)
      return NextResponse.json({ error: "Failed to update search" }, { status: 500 })
    }

    return NextResponse.json({ search: data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

