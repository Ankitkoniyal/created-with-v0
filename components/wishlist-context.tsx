"use client"

import * as React from "react"

type WishlistContextValue = {
  ids: string[]
  addToWishlist: (id: string) => void
  removeFromWishlist: (id: string) => void
  isInWishlist: (id: string) => boolean
  getWishlistCount: () => number
}

const WishlistContext = React.createContext<WishlistContextValue | null>(null)

/** Read | write localStorage under this key */
const KEY = "marketplace:wishlist"

function getInitial(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as string[]
  } catch {
    return []
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = React.useState<string[]>(getInitial)

  React.useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(ids))
  }, [ids])

  const addToWishlist = (id: string) => setIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  const removeFromWishlist = (id: string) => setIds((prev) => prev.filter((x) => x !== id))
  const isInWishlist = (id: string) => ids.includes(id)
  const getWishlistCount = () => ids.length

  return (
    <WishlistContext.Provider value={{ ids, addToWishlist, removeFromWishlist, isInWishlist, getWishlistCount }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = React.useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>")
  return ctx
}
