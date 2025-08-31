import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const url = process.env.SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRole) {
      // Server not configured; respond gracefully so client can fallback
      return NextResponse.json({ error: "Server not configured" }, { status: 200 })
    }

    const admin = createClient(url, serviceRole, { auth: { persistSession: false } })
    const { data, error } = await admin.auth.admin.getUserByEmail(email)
    if (error) {
      // Treat errors as "not found" to avoid leaking details
      return NextResponse.json({ exists: false }, { status: 200 })
    }
    return NextResponse.json({ exists: !!data?.user }, { status: 200 })
  } catch {
    // Network/parse issues: return a benign response
    return NextResponse.json({ exists: false }, { status: 200 })
  }
}
