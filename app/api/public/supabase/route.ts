import { NextResponse } from "next/server"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""

  // Always return JSON so clients never fail parsing
  if (!url || !anon) {
    return NextResponse.json(
      { ok: false, url: null, anon: null, reason: "missing_server_env" },
      {
        status: 200,
        headers: {
          "cache-control": "no-store",
        },
      },
    )
  }

  return NextResponse.json(
    { ok: true, url, anon },
    {
      status: 200,
      headers: {
        // short cache is fine, values rarely change
        "cache-control": "public, max-age=300",
      },
    },
  )
}
