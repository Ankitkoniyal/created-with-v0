"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

export function HeroBanner() {
  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          <div className="absolute top-32 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            List Fast.{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Sell Faster
            </span>
          </h1>

          {/* Subheading */}
          <h3 className="text-xl md:text-2xl lg:text-3xl font-medium mb-8 text-blue-100 max-w-4xl mx-auto leading-relaxed">
            India's fastest-growing local classifieds platform
          </h3>

          {/* Description */}
          <p className="text-lg md:text-xl text-blue-200 mb-10 max-w-3xl mx-auto leading-relaxed">
            Connect with millions of buyers and sellers in your city. Post your ad in minutes and start selling today!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold px-8 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 text-lg"
              asChild
            >
              <Link href="/post-ad" className="flex items-center gap-3">
                <Zap className="h-5 w-5" />
                Post Your Ad Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold px-8 py-4 rounded-full backdrop-blur-sm transition-all duration-300 text-lg bg-transparent"
              asChild
            >
              <Link href="/search">Browse Ads</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">10K+</div>
              <div className="text-blue-200">Active Listings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">50K+</div>
              <div className="text-blue-200">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">100+</div>
              <div className="text-blue-200">Cities Covered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
