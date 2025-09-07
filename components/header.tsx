"use client"

import type React from "react"

import type { ReactElement } from "react"
import { useState, useEffect, useRef } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { MegaMenu } from "@/components/mega-menu"
import { getSupabaseClient } from "@/lib/supabase/client"

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

export function Header(): ReactElement {
  const { user, profile, logout, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isAuthRoute = !!pathname && pathname.startsWith("/auth")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [locationInput, setLocationInput] = useState("")
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [filteredLocations, setFilteredLocations] = useState<string[]>([])
  const locationInputRef = useRef<HTMLInputElement>(null)
  const [showMegaMenu, setShowMegaMenu] = useState(false)
  const [notificationCounts, setNotificationCounts] = useState({
    favorites: 0,
    messages: 0,
    notifications: 0,
  })

  const allLocations = useState(() => {
    const locations: string[] = []
    CANADIAN_LOCATIONS.forEach((location) => {
      locations.push(location.province)
      location.cities.forEach((city) => {
        locations.push(`${city}, ${location.province}`)
      })
    })
    return locations
  })[0]

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value)
    if (value.trim() === "") {
      setFilteredLocations([])
      setShowLocationSuggestions(false)
      return
    }

    const filtered = allLocations.filter((location) => location.toLowerCase().includes(value.toLowerCase())).slice(0, 8)

    setFilteredLocations(filtered)
    setShowLocationSuggestions(filtered.length > 0)
  }

  const handleLocationSelect = (location: string) => {
    setLocationInput(location)
    setSelectedLocation(location)
    setShowLocationSuggestions(false)
    locationInputRef.current?.blur()
  }

  const handleLocationFocus = () => {
    setLocationInput("")
    setShowLocationSuggestions(false)
  }

  const handleLocationBlur = () => {
    setTimeout(() => {
      setShowLocationSuggestions(false)
    }, 200)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim())
    }
    if (selectedLocation) {
      params.set("location", selectedLocation)
    }
    router.push(`/search?${params.toString()}`)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Force navigation even if logout fails
      router.push("/")
    }
  }

  const handleCategorySelect = (category: string) => {
    // Implement category selection logic here
  }

  useEffect(() => {
    if (!user?.id) return

    const fetchNotificationCounts = async () => {
      try {
        const supabase = await getSupabaseClient()
        if (!supabase) {
          return
        }

        const [favoritesResult, messagesResult] = await Promise.all([
          supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("receiver_id", user.id)
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

  // const isAuthenticated = !!user

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center flex-shrink-0">
            <Link href="/">
              <h1 className="text-2xl sm:text-3xl font-bold text-black cursor-pointer">M</h1>
            </Link>
          </div>

          <div className="flex-1 max-w-4xl mx-2 sm:mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center bg-white border-2 border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-300">
                <div className="flex items-center border-r border-gray-200 px-3 flex-1 relative">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-600 flex-shrink-0" />
                  <Input
                    ref={locationInputRef}
                    type="text"
                    placeholder="City or Location"
                    className="border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 w-full text-xs sm:text-sm"
                    value={locationInput}
                    onChange={(e) => handleLocationInputChange(e.target.value)}
                    onFocus={handleLocationFocus}
                    onBlur={handleLocationBlur}
                  />

                  {showLocationSuggestions && filteredLocations.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-64 overflow-y-auto">
                      {filteredLocations.map((location, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 flex items-center"
                          onClick={() => handleLocationSelect(location)}
                        >
                          <MapPin className="h-3 w-3 mr-2 text-green-600 flex-shrink-0" />
                          <span className="truncate">{location}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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

                <Button type="submit" size="sm" className="rounded-full px-6 py-2 mr-2 shadow-md hover:shadow-lg">
                  Search
                </Button>
              </div>
            </form>
          </div>

          <nav className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {user && (
              <>
                <Button variant="ghost" size="sm" className="relative" asChild>
                  <Link href="/dashboard/favorites" aria-label="Favorites">
                    <Heart className="h-4 w-4 text-green-800" />
                    {notificationCounts.favorites > 0 && (
                      <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                        {notificationCounts.favorites}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="relative" asChild>
                  <Link href="/dashboard/messages" aria-label="Messages">
                    <MessageCircle className="h-4 w-4 text-green-800" />
                    {notificationCounts.messages > 0 && (
                      <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                        {notificationCounts.messages}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="relative" asChild>
                  <Link href="/notifications" aria-label="Notifications">
                    <Bell className="h-4 w-4 text-green-800" />
                    {notificationCounts.notifications > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                        {notificationCounts.notifications}
                      </Badge>
                    )}
                  </Link>
                </Button>
              </>
            )}
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      // Replace the Avatar section with this code:
<Avatar className="h-8 w-8 border-2 border-green-600"> {/* Added border */}
  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || ""} alt={profile?.name || "User"} />
  <AvatarFallback className="bg-green-100 text-green-800 font-medium"> {/* Added styling */}
    {profile?.name || user?.email
      ? (profile?.name || user?.email)[0]?.toUpperCase()
      : "U"}
  </AvatarFallback>
</Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
  <Link href="/dashboard" className="flex items-center"> {/* Changed from /dashboard/listings to /dashboard */}
    <Package className="mr-2 h-4 w-4" />
    <span>Dashboard</span> {/* Changed from "My Ads" to "Dashboard" */}
  </Link>
</DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="flex items-center">
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
                    router.push("/sell")
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
                {!isAuthRoute && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth/login">
                      <User className="h-4 w-4 mr-2" />
                      Login/Sign up
                    </Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-green-900 hover:bg-green-950 text-white font-medium px-4 py-2 rounded-full shadow-lg hover:shadow-green-900/30 transition-all duration-300 transform hover:scale-105 border border-white/10 hover:border-white/20 relative overflow-hidden group"
                  onClick={() => {
                    router.push("/auth/login?redirectedFrom=" + encodeURIComponent("/sell"))
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
