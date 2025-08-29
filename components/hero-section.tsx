"use client"
import { Upload, Link2, PlayCircle } from "lucide-react"

export function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-br from-green-800 via-green-700 to-green-900 text-white py-12 px-4">
      <div className="max-w-5xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-balance leading-tight">
          Canada's Fastest Growing
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold mb-8 text-green-200">
          Ads Marketplace
        </h2>

        {/* Compact Professional Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto mb-10">
          <div className="bg-white/95 rounded-xl p-5 text-center shadow-lg border border-green-200/50 transition-all hover:shadow-xl hover:border-green-300">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-3 rounded-2xl w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-base mb-1.5 text-gray-800">Unlimited Ads</h3>
            <p className="text-green-600 text-sm font-medium">Free Forever</p>
          </div>

          <div className="bg-white/95 rounded-xl p-5 text-center shadow-lg border border-green-200/50 transition-all hover:shadow-xl hover:border-green-300">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-3 rounded-2xl w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-base mb-1.5 text-gray-800">Website URL</h3>
            <p className="text-green-600 text-sm font-medium">Free Included</p>
          </div>

          <div className="bg-white/95 rounded-xl p-5 text-center shadow-lg border border-green-200/50 transition-all hover:shadow-xl hover:border-green-300">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-3 rounded-2xl w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-base mb-1.5 text-gray-800">YouTube Video</h3>
            <p className="text-green-600 text-sm font-medium">Free Upload</p>
          </div>
        </div>

        {/* Sophisticated Modern Button */}
        <button className="bg-white text-green-800 font-bold py-4 px-10 rounded-full text-base hover:bg-green-50 transition-all duration-300 transform hover:-translate-y-1 shadow-2xl hover:shadow-3xl border-2 border-green-300/30 hover:border-green-400/50">
          Post Free Ads
        </button>

        {/* Professional subtitle */}
        <div className="mt-4 text-green-200 text-sm font-light">
          Join thousands of successful advertisers today
        </div>
      </div>
    </section>
  )
}
