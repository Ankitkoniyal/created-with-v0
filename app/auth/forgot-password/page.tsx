"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { rateLimit } from "@/lib/rate-limit"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const limit = rateLimit(`forgot:${email}`, 3, 60_000)
      if (!limit.allowed) {
        setError("Too many reset attempts. Please wait a minute before trying again.")
        return
      }

      const supabase = createClient()

      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/update-password` : undefined

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (resetErr) {
        if (resetErr?.message?.toLowerCase().includes("rate limit")) {
          setError("Too many attempts. Please try again in a few minutes.")
        } else {
          setError(resetErr.message || "Could not send reset email. Please try again.")
        }
        return
      }

      setMessage("Password reset email sent. Please check your inbox.")
    } catch (err: any) {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Forgot password</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your account email. We’ll send you a secure link to reset your password.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {message && <div className="text-green-600 text-sm">{message}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-emerald-700 text-white py-2 disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <div className="mt-6 text-sm">
        <Link href="/auth/login" className="underline">
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
