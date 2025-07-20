"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LocationSearch } from "@/components/location-search"
import { Heart, MessageCircle, Bell, User, LogOut, Plus, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useWishlist } from "@/components/wishlist-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function Navbar() {
  const { user, signOut } = useAuth()
  const { getWishlistCount } = useWishlist()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")

  const handleSignOut = () => {
    signOut()
    router.push("/")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (location) params.set("location", location)
    router.push(`/search?${params.toString()}`)
  }

  const wishlistCount = getWishlistCount()

  return (
    <nav className="border-b bg-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">MarketPlace</span>
            </Link>
          </div>

          {/* Search Section - Center */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="flex w-full gap-2">
              {/* Product Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-300 focus:border-blue-500"
                />
              </div>

              {/* Location Search */}
              <div className="w-48">
                <LocationSearch
                  value={location}
                  onChange={setLocation}
                  placeholder="Location..."
                  className="h-10 border-gray-300 focus:border-blue-500"
                />
              </div>

              {/* Search Button */}
              <Button type="submit" className="h-10 px-6 bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Right side icons and buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Wishlist */}
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link href="/wishlist">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {wishlistCount}
                      </Badge>
                    )}
                  </Link>
                </Button>

                {/* Messages */}
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link href="/messages">
                    <MessageCircle className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      2
                    </Badge>
                  </Link>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link href="/notifications">
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      5
                    </Badge>
                  </Link>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user.full_name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/my-ads">My Ads</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Post Ads Button */}
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Link href="/post-ad" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Post Ads</span>
                    <span className="sm:hidden">Post</span>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                {/* Wishlist (disabled for non-users) */}
                <Button variant="ghost" size="icon" disabled>
                  <Heart className="h-5 w-5" />
                </Button>

                {/* Messages (disabled for non-users) */}
                <Button variant="ghost" size="icon" disabled>
                  <MessageCircle className="h-5 w-5" />
                </Button>

                {/* Login/Sign Up */}
                <Button variant="outline" asChild>
                  <Link href="/auth" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Login/Sign Up</span>
                  </Link>
                </Button>

                {/* Post Ads Button */}
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Link href="/auth" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Post Ads</span>
                    <span className="sm:hidden">Post</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Search – shown on small screens */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            {/* product query */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search items…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-gray-300 focus:border-blue-500"
              />
            </div>

            {/* location query */}
            <div className="flex-1">
              <LocationSearch
                value={location}
                onChange={setLocation}
                placeholder="Location…"
                className="h-10 border-gray-300 focus:border-blue-500"
              />
            </div>

            {/* submit */}
            <Button type="submit" size="icon" className="h-10 w-10 bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
        </div>
      </div>
    </nav>
  )
}
