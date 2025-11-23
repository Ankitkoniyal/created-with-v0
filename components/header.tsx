"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
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
  Crown,
  FileText,
  Clock,
  Flag,
  Users as UsersIcon,
  Tag,
  MapPin as MapPinIcon,
  BarChart3,
  Plus,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
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
import { useLanguage } from "@/hooks/use-language"
import { CategoryNavigation } from "@/components/category-navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { createClient as createSupabaseClient } from "@/lib/supabase/client"

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

const SUPER_ADMIN_LINKS = [
  { view: "overview", label: "Super Admin Dashboard", icon: Crown },
  { view: "ads", label: "Ads Management", icon: FileText },
  { view: "pending", label: "Pending Review", icon: Clock },
  { view: "reported", label: "Reported Ads", icon: Flag },
  { view: "users", label: "User Management", icon: UsersIcon },
  { view: "categories", label: "Categories", icon: Tag },
  { view: "localities", label: "Localities", icon: MapPinIcon },
  { view: "analytics", label: "Analytics", icon: BarChart3 },
  { view: "settings", label: "System Settings", icon: Settings },
]

export function Header() {
  const { user, profile, logout, isLoading, isSuperAdmin } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAuthRoute = !!pathname && pathname.startsWith("/auth")
  
  // Location persistence key
  const LOCATION_STORAGE_KEY = "user_selected_location"
  
  // Get current location: Priority 1) URL param, 2) localStorage, 3) empty
  const getInitialLocation = () => {
    if (typeof window === "undefined") return ""
    const urlLocation = searchParams.get("location") || ""
    if (urlLocation) return urlLocation
    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY)
      return stored || ""
    } catch {
      return ""
    }
  }
  
  const currentLocation = getInitialLocation()
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
  const [hasHydrated, setHasHydrated] = useState(false)
  const [notificationCounts, setNotificationCounts] = useState({
    favorites: 0,
    messages: 0,
    notifications: 0,
  })
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const allLocations = CANADIAN_LOCATIONS.flatMap(location => [
    location.province,
    ...location.cities.map(city => `${city}, ${location.province}`)
  ])

  useEffect(() => {
    setHasHydrated(true)
  }, [])


  // Initialize location from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const storedLocation = localStorage.getItem(LOCATION_STORAGE_KEY) || ""
    const urlLocation = searchParams.get("location") || ""
    
    // If URL has location, use it and update localStorage
    if (urlLocation) {
      setSelectedLocation(urlLocation)
      setLocationInput(urlLocation)
      try {
        localStorage.setItem(LOCATION_STORAGE_KEY, urlLocation)
      } catch {}
    } 
    // If no URL location but we have stored location, use it and update URL if on home/search
    else if (storedLocation && (pathname === "/" || pathname === "/search")) {
      setSelectedLocation(storedLocation)
      setLocationInput(storedLocation)
      // Update URL with stored location
      const params = new URLSearchParams(searchParams.toString())
      params.set("location", storedLocation)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
    
    setSearchQuery(currentQuery)
  }, []) // Only run on mount
  
  // Update location when URL changes (but don't override if user just selected)
  useEffect(() => {
    const urlLocation = searchParams.get("location") || ""
    if (urlLocation && urlLocation !== selectedLocation) {
      setSelectedLocation(urlLocation)
      setLocationInput(urlLocation)
      // Update localStorage
      try {
        localStorage.setItem(LOCATION_STORAGE_KEY, urlLocation)
      } catch {}
    }
    setSearchQuery(currentQuery)
  }, [searchParams])

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
      // Try Supabase locations first
      const fetchFromDatabase = async () => {
        try {
          const supabase = createSupabaseClient()
          const searchValue = value.toLowerCase().trim()
          
          // Search city column directly - this is more reliable than search_text
          // The trigram index on search_text will still help with performance
          const { data, error } = await supabase
            .from("locations")
            .select("city, province, population")
            .ilike("city", `%${searchValue}%`)
            .order("population", { ascending: false, nullsFirst: false })
            .limit(8)

          if (error) {
            console.error("Location search error:", error)
            // Fallback to local list on error
            const filtered = allLocations
              .filter((location) => location.toLowerCase().includes(searchValue))
              .slice(0, 8)
            setFilteredLocations(filtered)
            setShowLocationSuggestions(filtered.length > 0)
            return
          }

          if (data && data.length > 0) {
            const results = data.map((row: any) => `${row.city}, ${row.province}`)
            setFilteredLocations(results)
            setShowLocationSuggestions(true)
            return
          }

          // Fallback to local list if DB has no results
          const filtered = allLocations
            .filter((location) => location.toLowerCase().includes(searchValue))
            .slice(0, 8)
          setFilteredLocations(filtered)
          setShowLocationSuggestions(filtered.length > 0)
        } catch (err) {
          console.error("Location search exception:", err)
          // Fallback to local list on any error
          const filtered = allLocations
            .filter((location) => location.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 8)
          setFilteredLocations(filtered)
          setShowLocationSuggestions(filtered.length > 0)
        }
      }

      fetchFromDatabase()
    }, 200)

    return () => clearTimeout(timeoutId)
  }

  const handleLocationSelect = (location: string) => {
    setLocationInput(location)
    setSelectedLocation(location)
    setShowLocationSuggestions(false)
    locationInputRef.current?.blur()
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, location)
    } catch (err) {
      console.error("Failed to save location to localStorage:", err)
    }
    
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
      const storedLocation = typeof window !== "undefined" 
        ? localStorage.getItem(LOCATION_STORAGE_KEY) || ""
        : ""
      const locationToRestore = selectedLocation || storedLocation
      if (!locationInput.trim() && locationToRestore) {
        setLocationInput(locationToRestore)
        setSelectedLocation(locationToRestore)
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
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
      setIsLoggingOut(false)
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Clear location - also remove from localStorage
  const clearLocation = () => {
    setLocationInput("")
    setSelectedLocation("")
    try {
      localStorage.removeItem(LOCATION_STORAGE_KEY)
    } catch (err) {
      console.error("Failed to remove location from localStorage:", err)
    }
    
    // Update URL to remove location param
    const params = new URLSearchParams(searchParams.toString())
    params.delete("location")
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(newUrl, { scroll: false })
    
    if (locationInputRef.current) {
      locationInputRef.current.focus()
    }
  }

  useEffect(() => {
    if (!hasHydrated || !user?.id) return

    const fetchNotificationCounts = async () => {
      try {
        const supabase = await getSupabaseClient()
        if (!supabase) {
          return
        }

        const [favoritesResult, messagesResult, notificationsResult] = await Promise.all([
          supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("receiver_id", user.id)
            .eq("is_read", false),
          (async () => {
            try {
              const result = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("read", false)
              
              // Gracefully handle if table doesn't exist
              if (result.error && (result.error.code === '42P01' || result.error.message?.includes('does not exist'))) {
                return { count: 0, error: null, data: null }
              }
              return result
            } catch (error: any) {
              // If table doesn't exist, return empty count
              if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
                return { count: 0, error: null, data: null }
              }
              return { count: 0, error, data: null }
            }
          })(),
        ])

        const notificationsCount =
          notificationsResult.count && notificationsResult.count > 0
            ? notificationsResult.count
            : 0

        setNotificationCounts({
          favorites: favoritesResult.count || 0,
          messages: messagesResult.count || 0,
          notifications: notificationsCount,
        })
      } catch (error) {
        const err = error as { code?: string; message?: string }
        const message = (err?.message ?? "").toLowerCase()
        const tableMissing =
          err?.code === "42P01" || message.includes("relation") || message.includes("does not exist")
        if (tableMissing) {
          setNotificationCounts((prev) => ({
            ...prev,
            notifications: 0,
          }))
        } else {
          console.error("Error fetching notification counts:", error)
        }
      }
    }

    fetchNotificationCounts()

    const interval = setInterval(fetchNotificationCounts, 300000)
    return () => clearInterval(interval)
  }, [user?.id, hasHydrated])

  const showUserNav = hasHydrated && !!user
  const showAuthButtons = hasHydrated && !user

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
              <div className={`flex items-center bg-white border-2 rounded-full shadow-sm ${
                isSearchFocused || isLocationFocused 
                  ? "border-green-600 shadow-lg ring-2 ring-green-600/20" 
                  : "border-gray-200 hover:border-gray-300"
              } transition-all duration-200`}>
                {/* Location Input */}
                <div className="flex items-center border-r border-gray-200 px-3 sm:px-4 flex-1 relative min-w-0">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600 flex-shrink-0" />
                  <Input
                    ref={locationInputRef}
                    type="text"
                    placeholder={t("header.locationPlaceholder")}
                    className="border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 w-full text-xs sm:text-sm pr-8 placeholder:text-gray-400"
                    value={locationInput}
                    onChange={handleLocationInputChange}
                    onFocus={handleLocationFocus}
                    onBlur={handleLocationBlur}
                  />
                  {hasHydrated && locationInput && (
                    <button
                      type="button"
                      onClick={clearLocation}
                      className="absolute right-2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear location"
                    >
                      ×
                    </button>
                  )}

                  {showLocationSuggestions && filteredLocations.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 z-50 max-h-64 overflow-y-auto">
                      {filteredLocations.map((location, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-sm border-b border-gray-100 last:border-b-0 flex items-center transition-colors"
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
                <div className="flex-2 flex items-center px-4 sm:px-5 min-w-0 relative">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-3 flex-shrink-0" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder={t("header.searchPlaceholder")}
                    className="border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 text-sm placeholder:text-gray-400 pr-8"
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
                      className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <Button 
                  type="submit" 
                  size="sm" 
                  className="rounded-full px-5 sm:px-6 py-2 mr-2 bg-green-900 hover:bg-green-950 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Search className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">{t("header.search")}</span>
                </Button>
              </div>
            </form>
          </div>

          {/* User Navigation */}
          <nav className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {showUserNav && (
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
            {showUserNav ? (
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
                          {profile?.name
                            ? profile.name[0]?.toUpperCase()
                            : user?.email
                            ? user.email[0]?.toUpperCase()
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
                    {isSuperAdmin && (
                      <>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Super Admin</DropdownMenuLabel>
                        {SUPER_ADMIN_LINKS.map((item) => {
                          const Icon = item.icon
                          const href = item.view === "overview" ? "/superadmin" : `/superadmin?view=${item.view}`
                          return (
                            <DropdownMenuItem key={item.view} asChild>
                              <Link href={href} className="flex items-center">
                                <Icon className="mr-2 h-4 w-4" />
                                <span>{item.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          )
                        })}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">{t("userMenu.dashboard")}</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={isSuperAdmin ? "/superadmin" : "/dashboard"} className="flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>{isSuperAdmin ? "Super Admin Dashboard" : t("userMenu.overview")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/listings" className="flex items-center">
                        <Package className="mr-2 h-4 w-4" />
                        <span>{t("userMenu.myAds")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/favorites" className="flex items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>{t("userMenu.favorites")}</span>
                        {notificationCounts.favorites > 0 && (
                          <Badge variant="secondary" className="ml-auto h-5 w-5 p-0 text-xs flex items-center justify-center">
                            {notificationCounts.favorites}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/messages" className="flex items-center">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        <span>{t("userMenu.messages")}</span>
                        {notificationCounts.messages > 0 && (
                          <Badge variant="secondary" className="ml-auto h-5 w-5 p-0 text-xs flex items-center justify-center">
                            {notificationCounts.messages}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/analytics" className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>{t("userMenu.analytics")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">{t("userMenu.account")}</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t("userMenu.profile")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t("userMenu.settings")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isLoggingOut ? t("header.loggingOut") : t("header.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  className="bg-green-900 hover:bg-green-950 text-white font-bold px-6 py-3 rounded-xl shadow-2xl shadow-green-900/40 hover:shadow-green-900/60 border-2 border-green-800 hover:border-green-700"
                  onClick={() => {
                    router.push("/sell")
                  }}
                >
                  <span>{t("header.sell")}</span>
                </Button>
              </>
            ) : (
              <>
                {showAuthButtons && !isAuthRoute && (
                  <Link
                    href="/auth/login"
                    className={buttonVariants({ variant: "ghost", size: "sm" }) + " flex items-center"}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t("header.loginSignup")}
                  </Link>
                )}
                {showAuthButtons && (
                  <Button
                    size="sm"
                    className="bg-green-900 hover:bg-green-950 text-white font-bold px-6 py-3 rounded-xl shadow-2xl shadow-green-900/40 hover:shadow-green-900/60 border-2 border-green-800 hover:border-green-700"
                    onClick={() => {
                      router.push("/auth/login?redirectedFrom=" + encodeURIComponent("/sell"))
                    }}
                  >
                    <span>{t("header.sell")}</span>
                  </Button>
                )}
              </>
            )}
          </nav>

          <Button variant="ghost" size="sm" className="md:hidden flex-shrink-0">
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* New Category Navigation - Hidden on auth pages */}
        {!isAuthRoute && (
          <div className="border-t border-gray-100 bg-white">
            <div className="flex items-center justify-start py-3 px-4">
              <CategoryNavigation />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
