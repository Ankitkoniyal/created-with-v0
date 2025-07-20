"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { mockUsers, type User } from "./mock-data"

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Mock authentication - in real app, this would call your backend
    const foundUser = mockUsers.find((u) => u.email === email)

    if (foundUser && password === "password123") {
      setUser(foundUser)
      localStorage.setItem("currentUser", JSON.stringify(foundUser))
      return { success: true }
    }

    return { success: false, error: "Invalid email or password" }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    // Mock registration
    const newUser: User = {
      id: Date.now().toString(),
      email,
      full_name: fullName,
      phone: "",
    }

    setUser(newUser)
    localStorage.setItem("currentUser", JSON.stringify(newUser))
    return { success: true }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  return <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
