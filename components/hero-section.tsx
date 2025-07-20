"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LocationSearch } from "@/components/location-search"
import { Search, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (location) params.set("location", location)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 py-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">Find Amazing Deals Near You</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Discover unique items from trusted sellers in your community. Buy, sell, and connect with ease - no payments
          through the platform!
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Product Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-14 text-lg border-2 border-gray-200 focus:border-blue-500"
              />
            </div>

            {/* Location Search */}
            <div className="flex-1">
              <LocationSearch
                value={location}
                onChange={setLocation}
                placeholder="Enter location..."
                className="h-14 text-lg border-2 border-gray-200 focus:border-blue-500"
              />
            </div>

            {/* Search Button */}
            <Button type="submit" size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-lg font-semibold">
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="lg" className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg" asChild>
          <a href="/post-ad">
            <Plus className="h-6 w-6" />
          </a>
        </Button>
      </div>
    </div>
  )
}
