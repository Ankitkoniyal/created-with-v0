"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { loginSchema, signupSchema } from "@/lib/validation/schemas"
import { sanitizeText } from "@/lib/security/sanitization"
import { authLimiter } from "@/lib/security/rate-limiting"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing", success: false, redirect: null }
  }

  const clientId = "auth-signin" // In production, use proper client identification
  if (!authLimiter.isAllowed(clientId)) {
    return {
      error: "Too many login attempts. Please wait before trying again.",
      success: false,
      redirect: null,
    }
  }

  const rawEmail = formData.get("email")
  const rawPassword = formData.get("password")

  if (!rawEmail || !rawPassword) {
    return { error: "Email and password are required", success: false, redirect: null }
  }

  try {
    const validatedData = loginSchema.parse({
      email: sanitizeText(rawEmail.toString()),
      password: rawPassword.toString(), // Don't sanitize passwords
    })

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Invalid email or password", success: false, redirect: null }
      } else if (error.message.includes("Email not confirmed")) {
        return { error: "Please verify your email address", success: false, redirect: null }
      }
      return { error: "Authentication failed", success: false, redirect: null }
    }

    return { success: true, redirect: "/dashboard", error: null }
  } catch (validationError: any) {
    if (validationError.errors) {
      return { error: validationError.errors[0].message, success: false, redirect: null }
    }
    return { error: "Invalid input data", success: false, redirect: null }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const clientId = "auth-signup"
  if (!authLimiter.isAllowed(clientId)) {
    return { error: "Too many signup attempts. Please wait before trying again." }
  }

  const rawEmail = formData.get("email")
  const rawPassword = formData.get("password")
  const rawFullName = formData.get("fullName")
  const rawPhone = formData.get("phone")

  if (!rawEmail || !rawPassword || !rawFullName) {
    return { error: "Email, password, and full name are required" }
  }

  try {
    const validatedData = signupSchema.parse({
      email: sanitizeText(rawEmail.toString()),
      password: rawPassword.toString(),
      fullName: sanitizeText(rawFullName.toString()),
      phone: rawPhone ? sanitizeText(rawPhone.toString()) : undefined,
    })

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

    const redirectUrl =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`

    const { error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: validatedData.fullName,
          phone: validatedData.phone || "",
        },
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "An account with this email already exists" }
      }
      return { error: "Account creation failed. Please try again." }
    }

    return { success: "Please check your email to verify your account." }
  } catch (validationError: any) {
    if (validationError.errors) {
      return { error: validationError.errors[0].message }
    }
    return { error: "Invalid input data" }
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
