"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // If Supabase sent us a ?code=… recovery link, exchange it for a session
    const code = params?.get("code")
    async function bootstrap() {
      const supabase = createClient()
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.log("[v0] exchangeCodeForSession failed:", error.message)
          }
        }
      } finally {
        setReady(true)
      }
    }
    bootstrap()
  }, [params])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ready || submitting) return
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.")
        return
      }
      if (password !== confirm) {
        setError("Passwords do not match.")
        return
      }

      const supabase = createClient()

      const { error: updErr } = await supabase.auth.updateUser({ password })
      if (updErr) {
        setError(updErr.message || "Could not update password.")
        return
      }

      setMessage("Password updated successfully. Redirecting to sign in…")
      // Small delay for UX, then go to login
      setTimeout(() => router.push("/auth/login"), 1200)
    } catch (err: any) {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Set a new password</h1>
      <p className="text-sm text-muted-foreground mb-6">Choose a strong password you don’t use elsewhere.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {message && <div className="text-green-600 text-sm">{message}</div>}

        <button
          type="submit"
          disabled={!ready || submitting}
          className="w-full rounded-md bg-emerald-700 text-white py-2 disabled:opacity-60"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  )
}
