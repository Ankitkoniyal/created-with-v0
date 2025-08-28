"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  Heart,
  User,
  Menu,
  LogOut,
  Settings,
  Package,
  Bell,
  MapPin,
  MessageCircle,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { MegaMenu } from "@/components/mega-menu"
import { createBrowserClient } from "@supabase/ssr"

const CANADIAN_LOCATIONS = [
  { province: "Alberta", cities: ["Calgary", "Edmonton", "Red Deer", "Lethbridge"] },
  { province: "British Columbia", cities: ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond"] },
  { province: "Manitoba", cities: ["Winnipeg", "Brandon", "Steinbach"] },
  { province: "New Brunswick", cities: ["Saint John", "Moncton", "Fredericton"] },
  { province: "Newfoundland and Labrador", cities: ["St. John's", "Corner Brook", "Mount Pearl"] },
  { province: "Northwest Territories", cities: ["Yellowknife", "Hay River"] },
  { province: "Nova Scotia", cities: ["Halifax", "Sydney", "Dartmouth"] },
  { province: "Nunavut", cities: ["Iqaluit", "Rankin Inlet"] },
  { province: "Ontario", cities: ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham"] },
  { province: "Prince Edward Island", cities: ["Charlottetown", "Summerside"] },
  { province: "Quebec", cities: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil"] },
  { province: "Saskatchewan", cities: ["Saskatoon", "Regina", "Prince Albert"] },
  { province: "Yukon", cities: ["Whitehorse", "Dawson City"] },
]

const CATEGORIES = [
  "All Categories",
  "Books",
  "Electronics",
  "Fashion",
  "Furniture",
  "Gaming",
  "Jobs",
  "Mobile",
  "Other",
  "Pets",
  "Real Estate",
  "Services",
  "Vehicles",
]

export function Header() {
  const { user, profile, logout, isLoading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("All Canada")
  const [showMegaMenu, setShowMegaMenu] = useState(false)
  const [notificationCounts, setNotificationCounts] = useState({
    favorites: 0,
    messages: 0,
    notifications: 0,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search logic here
  }

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const handleCategorySelect = (category: string) => {
    // Implement category selection logic here
  }

  useEffect(() => {
    if (!user?.id) return

    const fetchNotificationCounts = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const [favoritesResult, messagesResult] = await Promise.all([
          supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("recipient_id", user.id)
            .eq("is_read", false),
        ])

        setNotificationCounts({
          favorites: favoritesResult.count || 0,
          messages: messagesResult.count || 0,
          notifications: 0,
        })
      } catch (error) {
        console.error("Error fetching notification counts:", error)
      }
    }

    fetchNotificationCounts()

    const interval = setInterval(fetchNotificationCounts, 300000)
    return () => clearInterval(interval)
  }, [user?.id])

  // Show loading state for header
  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl sm:text-3xl font-bold text-black cursor-pointer">M</h1>
              </Link>
            </div>

            {/* Loading placeholder for search */}
            <div className="flex-1 max-w-4xl mx-2 sm:mx-4 lg:mx-8">
              <div className="flex items-center bg-white border-2 border-gray-200 rounded-full shadow-lg h-12">
                <div className="flex-1 h-4 bg-gray-200 rounded mx-4 animate-pulse"></div>
              </div>
            </div>

            {/* Loading placeholder for nav */}
            <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Check if user is authenticated (both Supabase user and profile exist)
  const isAuthenticated = user && profile

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/">
              <h1 className="text-2xl sm:text-3xl font-bold text-black cursor-pointer">M</h1>
            </Link>
          </div>

          <div className="flex-1 max-w-4xl mx-2 sm:mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center bg-white border-2 border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-300">
                {/* Location Selector */}
                <div className="flex items-center border-r border-gray-200 px-3 flex-1">
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 w-full text-xs sm:text-sm">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-600" />
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Canada" className="font-semibold">
                        All Canada
                      </SelectItem>
                      {CANADIAN_LOCATIONS.map((location) => (
                        <div key={location.province}>
                          <SelectItem value={location.province} className="font-semibold">
                            {location.province}
                          </SelectItem>
                          {location.cities.map((city) => (
                            <SelectItem key={city} value={`${city}, ${location.province}`} className="pl-6">
                              {city}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Input */}
                <div className="flex-2 flex items-center px-4">
                  <Search className="h-4 w-4 text-green-600 mr-3" />
                  <Input
                    type="search"
                    placeholder="Search products, brands and more..."
                    className="border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 text-sm placeholder:text-gray-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Search Button */}
                <Button
                  type="submit"
                  size="sm"
                  className="bg-green-900 hover:bg-green-950 text-white rounded-full px-6 py-2 mr-2 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4 flex-shrink-0">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="text-green-800 hover:text-green-900 font-medium">
                Home
              </Link>
            </Button>
            {isAuthenticated && (
              <>
                <Button variant="ghost" size="sm" className="relative" asChild>
                  <Link href="/dashboard/favorites">
                    <Heart className="h-4 w-4 text-green-800" />
                    {notificationCounts.favorites > 0 && (
                      <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                        {notificationCounts.favorites}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="relative" asChild>
                  <Link href="/dashboard/messages">
                    <MessageCircle className="h-4 w-4 text-green-800" />
                    {notificationCounts.messages > 0 && (
                      <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                        {notificationCounts.messages}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4 text-green-800" />
                  {notificationCounts.notifications > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                      {notificationCounts.notifications}
                    </Badge>
                  )}
                </Button>
              </>
            )}
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={profile?.avatar_url || "/placeholder.svg"}
                          alt={profile?.full_name || "User"}
                        />
                        <AvatarFallback>
                          {profile?.full_name && typeof profile.full_name === "string"
                            ? profile.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/listings">
                        <Package className="mr-2 h-4 w-4" />
                        <span>My Ads</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  className="bg-green-900 hover:bg-green-950 text-white font-medium px-4 py-2 rounded-full shadow-lg hover:shadow-green-900/30 transition-all duration-300 transform hover:scale-105 border border-white/10 hover:border-white/20 relative overflow-hidden group"
                  onClick={() => {
                    if (!isAuthenticated) {
                      router.push("/auth/login?redirectedFrom=" + encodeURIComponent("/sell"))
                    } else {
                      router.push("/sell")
                    }
                  }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="font-semibold">SELL NOW</span>
                  </span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">
                    <User className="h-4 w-4 mr-2" />
                    Login/Sign up
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-green-900 hover:bg-green-950 text-white font-medium px-4 py-2 rounded-full shadow-lg hover:shadow-green-900/30 transition-all duration-300 transform hover:scale-105 border border-white/10 hover:border-white/20 relative overflow-hidden group"
                  onClick={() => {
                    if (!isAuthenticated) {
                      router.push("/auth/login?redirectedFrom=" + encodeURIComponent("/sell"))
                    } else {
                      router.push("/sell")
                    }
                  }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="font-semibold">SELL NOW</span>
                  </span>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile menu */}
          <Button variant="ghost" size="sm" className="md:hidden flex-shrink-0">
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between py-2 px-4">
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-black hover:text-gray-800 hover:bg-gray-100 font-semibold px-6 py-2 rounded-lg transition-all duration-200"
                onClick={() => setShowMegaMenu(!showMegaMenu)}
              >
                <span>All Categories</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${showMegaMenu ? "rotate-180" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>

        {showMegaMenu && (
          <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-2xl z-50">
            <MegaMenu onCategorySelect={handleCategorySelect} />
          </div>
        )}
      </div>
    </header>
  )
}
