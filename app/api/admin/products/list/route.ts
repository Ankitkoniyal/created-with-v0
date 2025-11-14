import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = createClient()
  const { page = 0, pageSize = 25, search = "", status = "all", category = "all", location = "all" } = await req.json()

  const from = page * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("products")
    .select("id, title, description, category, price, location, status, created_at, user_id, featured, profiles:profiles(email)", { count: "exact" })
    .order("created_at", { ascending: false })

  if (status !== "all") query = query.eq("status", status)
  if (category !== "all") query = query.eq("category", category)
  if (location !== "all") query = query.ilike("location", `%${location}%`)
  if (search.trim()) query = query.ilike("title", `%${search}%`)

  const { data, error, count } = await query.range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ads: data ?? [],
    count: count ?? 0,
    hasMore: count ? count > to + 1 : false,
  })
}
