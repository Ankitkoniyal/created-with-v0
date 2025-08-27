import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  // Generate CSRF token
  const token = randomBytes(32).toString("hex")

  // Set CSRF token in httpOnly cookie
  const cookieStore = cookies()
  cookieStore.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return NextResponse.json({ csrfToken: token })
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const storedToken = cookieStore.get("csrf-token")?.value
  const submittedToken = request.headers.get("x-csrf-token")

  if (!storedToken || !submittedToken || storedToken !== submittedToken) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }

  return NextResponse.json({ valid: true })
}
