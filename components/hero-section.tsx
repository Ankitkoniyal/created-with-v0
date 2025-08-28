"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Upload, Link, Video } from "lucide-react"

export function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl font-bold mb-8 text-balance">
          Canada's Fastest Growing
          <br />
          Ads Marketplace
        </h1>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex gap-2 bg-white rounded-full p-2">
            <Input
              placeholder="Find anything in Canada"
              className="flex-1 border-0 bg-transparent text-gray-900 placeholder:text-gray-500 focus-visible:ring-0"
            />
            <Button className="bg-green-600 hover:bg-green-700 text-white px-8 rounded-full">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-3 text-green-200" />
            <h3 className="font-semibold text-lg mb-1">Unlimited Ads</h3>
            <p className="text-green-100">(Free)</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <Link className="w-8 h-8 mx-auto mb-3 text-green-200" />
            <h3 className="font-semibold text-lg mb-1">Add Website URL</h3>
            <p className="text-green-100">(Free)</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <Video className="w-8 h-8 mx-auto mb-3 text-green-200" />
            <h3 className="font-semibold text-lg mb-1">Add YouTube Video</h3>
            <p className="text-green-100">(Free)</p>
          </div>
        </div>
      </div>
    </section>
  )
}
