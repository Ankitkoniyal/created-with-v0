import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const identifier =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"
    const limit = rateLimit(`check-email:${identifier}`, 10, 60_000)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((limit.reset - Date.now()) / 1000).toString(),
          },
        },
      )
    }

    // Use service role key for admin access
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      // Graceful fallback: allow client to proceed and rely on signUp to error
      return NextResponse.json({ exists: false, confirmed: false, note: 'not_configured' }, { status: 200 })
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if email exists using admin API with direct lookup
    const { data: userLookup, error } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    if (error && error.status !== 404) {
      console.error('Admin API error:', error)
      // Graceful fallback
      return NextResponse.json({ exists: false, confirmed: false, note: 'lookup_failed' }, { status: 200 })
    }

    const user = userLookup?.user
    const emailExists = !!user
    const confirmed = !!(user?.email_confirmed_at || (user as any)?.confirmed_at)

    console.log(`📧 Email check for ${email}: ${emailExists ? 'EXISTS' : 'AVAILABLE'}`)
    
    return NextResponse.json({ exists: emailExists, confirmed })
    
  } catch (error) {
    console.error('Email check error:', error)
    // Graceful fallback
    return NextResponse.json({ exists: false, confirmed: false, note: 'exception' }, { status: 200 })
  }
}
