"use client"

import type React from "react"
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
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { CategoryNavigation } from "@/components/category-navigation"
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

export function Header() {
  const { user, profile, logout, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAuthRoute = !!pathname && pathname.startsWith("/auth")
  
  // Get current location from URL if available
  const currentLocation = searchParams.get("location") || ""
  const currentQuery = searchParams.get("q") || ""
  
  const [searchQuery, setSearchQuery] = useState(currentQuery)
  const [selectedLocation, setSelectedLocation] = useState(currentLocation)
  const [locationInput, setLocationInput] = useState(currentLocation)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [filteredLocations, setFilteredLocations] = useState<string[]>([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isLocationFocused, setIsLocationFocused] = useState(false)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [notificationCounts, setNotificationCounts] = useState({
    favorites: 0,
    messages: 0,
    notifications: 0,
  })

  const allLocations = CANADIAN_LOCATIONS.flatMap(location => [
    location.province,
    ...location.cities.map(city => `${city}, ${location.province}`)
  ])

  // Update search and location when URL changes
  useEffect(() => {
    setSelectedLocation(currentLocation)
    setLocationInput(currentLocation)
    setSearchQuery(currentQuery)
  }, [currentLocation, currentQuery])

  // Debounced location search
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocationInput(value)
    
    if (value.trim() === "") {
      setFilteredLocations([])
      setShowLocationSuggestions(false)
      setSelectedLocation("") 
      return
    }

    // Debounce the filtering
    const timeoutId = setTimeout(() => {
      const filtered = allLocations.filter((location) =>
        location.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)

      setFilteredLocations(filtered)
      setShowLocationSuggestions(filtered.length > 0)
    }, 200)

    return () => clearTimeout(timeoutId)
  }

  const handleLocationSelect = (location: string) => {
    setLocationInput(location)
    setSelectedLocation(location)
    setShowLocationSuggestions(false)
    locationInputRef.current?.blur()
    
    // Create search params
    const params = new URLSearchParams()
    
    // Keep existing search query if present
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim())
    }
    
    // Set the location
    params.set("location", location)
    
    // If we're on homepage or search page, update with location filter
    if (pathname === "/" || pathname === "/search") {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    } else {
      // If on other page, go to search page with location filter
      router.push(`/search?${params.toString()}`)
    }
  }

  const handleLocationFocus = () => {
    setIsLocationFocused(true)
    if (locationInput === currentLocation) {
      setLocationInput("")
    }
    setShowLocationSuggestions(true)
  }

  const handleSearchFocus = () => {
    setIsSearchFocused(true)
  }

  const handleLocationBlur = () => {
    setIsLocationFocused(false)
    setTimeout(() => {
      setShowLocationSuggestions(false)
      // Restore current location if input is empty
      if (!locationInput.trim() && currentLocation) {
        setLocationInput(currentLocation)
        setSelectedLocation(currentLocation)
      }
    }, 200)
  }

  const handleSearchBlur = () => {
    setIsSearchFocused(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  const performSearch = () => {
    const params = new URLSearchParams()
    
    // Add search query if present
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery) {
      params.set("q", trimmedQuery)
    }
    
    // Add location if present
    const locationValue = selectedLocation || locationInput
    if (locationValue.trim()) {
      params.set("location", locationValue.trim())
    }
    
    // Always go to search page for searches
    router.push(`/search?${params.toString()}`)
  }

  // Handle Enter key in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      performSearch()
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/")
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Clear location
  const clearLocation = () => {
    setLocationInput("")
    setSelectedLocation("")
    if (locationInputRef.current) {
      locationInputRef.current.focus()
    }
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
              <div className={`flex items-center bg-white border-2 rounded-full ${
                isSearchFocused || isLocationFocused 
                  ? "border-green-600 shadow-md" 
                  : "border-gray-200"
              } transition-colors duration-200`}>
                {/* Location Input */}
                <div className="flex items-center border-r border-gray-200 px-3 flex-1 relative min-w-0">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-600 flex-shrink-0" />
                  <Input
                    ref={locationInputRef}
                    type="text"
                    placeholder="City or Location"
                    className="border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 w-full text-xs sm:text-sm pr-8"
                    value={locationInput}
                    onChange={handleLocationInputChange}
                    onFocus={handleLocationFocus}
                    onBlur={handleLocationBlur}
                  />
                  {locationInput && (
                    <button
                      type="button"
                      onClick={clearLocation}
                      className="absolute right-2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}

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

                {/* Search Input */}
                <div className="flex-2 flex items-center px-4 min-w-0 relative">
                  <Search className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search products, brands and more..."
                    className="border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 text-sm placeholder:text-gray-500 pr-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>

                <Button 
                  type="submit" 
                  size="sm" 
                  className="rounded-full px-6 py-2 mr-2 bg-green-900 hover:bg-green-950 text-white font-medium"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* User Navigation */}
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
                      <Avatar className="h-8 w-8 border-2 border-green-600">
                        <AvatarImage 
                          src={profile?.avatar_url || user?.user_metadata?.avatar_url || ""} 
                          alt={profile?.name || "User"} 
                        />
                        <AvatarFallback className="bg-green-100 text-green-800 font-medium">
                          {profile?.name || user?.email
                            ? (profile?.name || user.email)[0]?.toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
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
                  className="bg-green-900 hover:bg-green-950 text-white font-medium px-4 py-2 rounded-full"
                  onClick={() => {
                    router.push("/sell")
                  }}
                >
                  SELL NOW
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
                  className="bg-green-900 hover:bg-green-950 text-white font-medium px-4 py-2 rounded-full"
                  onClick={() => {
                    router.push("/auth/login?redirectedFrom=" + encodeURIComponent("/sell"))
                  }}
                >
                  SELL NOW
                </Button>
              </>
            )}
          </nav>

          <Button variant="ghost" size="sm" className="md:hidden flex-shrink-0">
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* New Category Navigation */}
        <div className="border-t border-gray-100 bg-white">
          <div className="flex items-center justify-start py-3 px-4">
            <CategoryNavigation />
          </div>
        </div>
      </div>
    </header>
  )
}
