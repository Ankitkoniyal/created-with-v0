"use client"
import { Upload, Link, Video } from "lucide-react"

export function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-r from-green-800 to-green-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          Canada's Fastest Growing
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">
          Ads Marketplace
        </h2>

        {/* Capsule-Style Feature Sections */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 max-w-2xl mx-auto mb-8">
          <div className="bg-green-700/90 rounded-full px-6 py-3 flex items-center gap-2 border-2 border-green-500">
            <Upload className="w-5 h-5" />
            <span className="font-semibold">Unlimited Ads (Free)</span>
          </div>

          <div className="bg-green-700/90 rounded-full px-6 py-3 flex items-center gap-2 border-2 border-green-500">
            <Link className="w-5 h-5" />
            <span className="font-semibold">Website URL (Free)</span>
          </div>

          <div className="bg-green-700/90 rounded-full px-6 py-3 flex items-center gap-2 border-2 border-green-500">
            <Video className="w-5 h-5" />
            <span className="font-semibold">YouTube Video (Free)</span>
          </div>
        </div>

        {/* CTA Button */}
        <button className="bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors mb-4">
          Post Free Ads
        </button>

        {/* Bold Subtitle */}
        <p className="text-green-200 text-lg font-bold">
          Join thousands of successful advertisers today
        </p>
      </div>
    </section>
  )
}
