"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  console.log("[v0] SignIn action called with prevState:", prevState)

  if (!formData) {
    console.log("[v0] No form data provided")
    return { error: "Form data is missing", success: false, redirect: null }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  console.log("[v0] SignIn attempt for email:", email)

  if (!email || !password) {
    console.log("[v0] Missing email or password")
    return { error: "Email and password are required", success: false, redirect: null }
  }

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      console.log("[v0] Sign in error:", error.message)
      return { error: error.message, success: false, redirect: null }
    }

    console.log("[v0] Sign in successful, user:", data.user?.email)
    const result = { success: true, redirect: "/dashboard", error: null }
    console.log("[v0] Returning result:", result)
    return result
  } catch (error: any) {
    console.error("[v0] Login error:", error)
    if (error.message && error.message.includes("Unexpected token")) {
      return { error: "Authentication service error. Please try again.", success: false, redirect: null }
    }
    return { error: "An unexpected error occurred. Please try again.", success: false, redirect: null }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const fullName = formData.get("fullName")
  const phone = formData.get("phone")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  try {
    const redirectUrl =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`

    console.log("[v0] Using redirect URL:", redirectUrl)

    const { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName?.toString() || "",
          phone: phone?.toString() || "",
        },
      },
    })

    if (error) {
      console.log("[v0] Sign up error:", error.message)
      return { error: error.message }
    }

    console.log("[v0] Sign up successful")
    return { success: "Check your email to confirm your account." }
  } catch (error: any) {
    console.error("[v0] Sign up error:", error)
    if (error.message && error.message.includes("Unexpected token")) {
      return { error: "Authentication service error. Please check your email format and try again." }
    }
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  await supabase.auth.signOut()
  redirect("/auth/login")
}
