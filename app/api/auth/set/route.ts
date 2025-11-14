import { NextResponse, type NextRequest } from "next/server" 
import { createServerClient } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const event = String(body?.event || "")
    const access_token = body?.access_token as string | null
    const refresh_token = body?.refresh_token as string | null

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anon) {
      console.error("Supabase environment variables missing")
      return new NextResponse(JSON.stringify({ ok: false, reason: "supabase_env_missing" }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json", 
          "Cache-Control": "no-store" 
        },
      })
    }

    let res = new NextResponse(JSON.stringify({ ok: true, event }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Cache-Control": "no-store" 
      },
    })

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          // Create a new response
          res = new NextResponse(JSON.stringify({ ok: true, event }), {
            status: 200,
            headers: { 
              "Content-Type": "application/json", 
              "Cache-Control": "no-store" 
            },
          })
          
          // Set all cookies on the response
          cookies.forEach(({ name, value, options }) => {
            if (value && options) {
              res.cookies.set(name, value, options)
            }
          })
        },
      },
    })

    // Handle different auth events
    if (event === "SIGNED_OUT") {
      console.log("Auth: Signing out user")
      await supabase.auth.signOut()
      return res
    }

    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      console.log(`Auth: ${event} event received`)
      
      if (access_token && refresh_token) {
        console.log("Auth: Setting session with tokens", {
          accessPreview: access_token.slice(0, 12) + "...",
          refreshPreview: refresh_token.slice(0, 12) + "...",
        })
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        })
        
        if (error) {
          console.error("Auth: Error setting session:", error)
          return new NextResponse(JSON.stringify({ 
            ok: false, 
            event, 
            reason: "session_set_failed",
            error: error.message 
          }), {
            status: 200,
            headers: { 
              "Content-Type": "application/json", 
              "Cache-Control": "no-store" 
            },
          })
        }
        
        console.log("Auth: Session set successfully")
        return res
      }
      
      console.log("Auth: Missing tokens, signing out")
      await supabase.auth.signOut()
      return new NextResponse(JSON.stringify({ 
        ok: false, 
        event, 
        reason: "missing_tokens" 
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json", 
          "Cache-Control": "no-store" 
        },
      })
    }

    console.log(`Auth: Unknown event '${event}', returning success`)
    return res

  } catch (error) {
    console.error("Auth sync error:", error)
    return new NextResponse(JSON.stringify({ 
      ok: false,
      error: "Internal server error" 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json", 
        "Cache-Control": "no-store" 
      },
    })
  }
}

// Add GET method to handle potential GET requests and fix 405 errors
export async function GET(req: NextRequest) {
  console.log("Auth: GET request received")
  return new NextResponse(JSON.stringify({ 
    message: 'Auth endpoint',
    method: 'GET'
  }), {
    status: 200,
    headers: { 
      "Content-Type": "application/json", 
      "Cache-Control": "no-store" 
    },
  })
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  console.log("Auth: OPTIONS request received")
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
