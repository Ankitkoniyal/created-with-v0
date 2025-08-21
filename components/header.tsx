"use client"

import type React from "react"
import { useState } from "react"
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
  const { user, logout } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("All Canada")
  const [showMegaMenu, setShowMegaMenu] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim())
    }
    if (selectedLocation && selectedLocation !== "All Canada") {
      params.set("location", selectedLocation)
    }

    const queryString = params.toString()
    router.push(`/search${queryString ? `?${queryString}` : ""}`)
  }

  const handleCategorySelect = (category: string, subcategory?: string) => {
    const params = new URLSearchParams()
    params.set("category", category)
    if (subcategory) {
      params.set("subcategory", subcategory)
    }
    if (selectedLocation && selectedLocation !== "All Canada") {
      params.set("location", selectedLocation)
    }
    router.push(`/search?${params.toString()}`)
    setShowMegaMenu(false)
  }

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
                  className="bg-green-800 hover:bg-green-900 text-white rounded-full px-6 py-2 mr-2 shadow-md hover:shadow-lg transition-all duration-200"
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
            {user && (
              <>
                <Button variant="ghost" size="sm" className="relative">
                  <Heart className="h-4 w-4 text-green-800" />
                  <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    3
                  </Badge>
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <MessageCircle className="h-4 w-4 text-green-800" />
                  <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    5
                  </Badge>
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4 text-green-800" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    2
                  </Badge>
                </Button>
              </>
            )}
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            ? user.name
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
                        <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="lg"
                  className="bg-green-800 hover:bg-green-900 text-white font-bold px-8 py-3 rounded-full shadow-2xl hover:shadow-green-800/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 border-2 border-white/20 hover:border-white/40 relative overflow-hidden group"
                  asChild
                >
                  <Link href="/sell">
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="font-extrabold">SELL NOW</span>
                    </span>
                  </Link>
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
                  size="lg"
                  className="bg-green-800 hover:bg-green-900 text-white font-bold px-8 py-3 rounded-full shadow-2xl hover:shadow-green-800/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 border-2 border-white/20 hover:border-white/40 relative overflow-hidden group"
                  asChild
                >
                  <Link href="/sell">
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="font-extrabold">SELL NOW</span>
                    </span>
                  </Link>
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

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">Popular Search:</span>
              <div className="flex gap-2">
                {["iPhone 15", "Honda Civic", "Apartment Toronto"].map((search) => (
                  <Link
                    key={search}
                    href={`/search?q=${encodeURIComponent(search)}`}
                    className="px-3 py-1 text-xs bg-white border border-green-200 text-green-700 rounded-full hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    {search}
                  </Link>
                ))}
              </div>
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
