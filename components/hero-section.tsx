"use client"
import { Upload, Link, Video } from "lucide-react"

export function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-r from-green-800 to-green-900 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Heading - Reduced top spacing */}
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Canada's Fastest Growing
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold mb-6 text-green-200">
          Ads Marketplace
        </h2>

        {/* Capsule-Style Feature Sections */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-3 max-w-2xl mx-auto mb-6">
          <div className="bg-green-700/90 rounded-full px-5 py-2 flex items-center gap-2 border-2 border-green-500">
            <Upload className="w-4 h-4" />
            <span className="font-semibold text-sm">Unlimited Ads (Free)</span>
          </div>

          <div className="bg-green-700/90 rounded-full px-5 py-2 flex items-center gap-2 border-2 border-green-500">
            <Link className="w-4 h-4" />
            <span className="font-semibold text-sm">Website URL (Free)</span>
          </div>

          <div className="bg-green-700/90 rounded-full px-5 py-2 flex items-center gap-2 border-2 border-green-500">
            <Video className="w-4 h-4" />
            <span className="font-semibold text-sm">YouTube Video (Free)</span>
          </div>
        </div>

        {/* Simple CTA Button - Dark green with white border and text */}
        <button className="bg-green-800 border-2 border-white text-white font-semibold py-2 px-6 rounded-full text-base transition-colors hover:bg-green-700 mb-3">
          Post Free Ads
        </button>

        {/* Bold Subtitle */}
        <p className="text-green-200 text-base font-bold">
          Join thousands of successful advertisers today
        </p>
      </div>
    </section>
  )
}
