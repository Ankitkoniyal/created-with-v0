import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import crypto from "crypto"

export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const cookieStore = await cookies()

  cookieStore.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return token
}

export async function validateCSRFToken(request: NextRequest, token: string): Promise<boolean> {
  const cookieStore = await cookies()
  const storedToken = cookieStore.get("csrf-token")?.value

  if (!storedToken || !token) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(storedToken, "hex"), Buffer.from(token, "hex"))
}
