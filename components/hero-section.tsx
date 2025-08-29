"use client"
import { Upload, Link, Video } from "lucide-react"

export function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-r from-green-800 to-green-900 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl font-bold mb-12 text-balance">
          Canada's Fastest Growin Ads Marketplace
        </h1>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-3 text-green-800" />
            <h3 className="font-semibold text-lg mb-1 text-gray-900">Unlimited Ads</h3>
            <p className="text-gray-600">(Free)</p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center">
            <Link className="w-8 h-8 mx-auto mb-3 text-green-800" />
            <h3 className="font-semibold text-lg mb-1 text-gray-900">Add Website URL</h3>
            <p className="text-gray-600">(Free)</p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center">
            <Video className="w-8 h-8 mx-auto mb-3 text-green-800" />
            <h3 className="font-semibold text-lg mb-1 text-gray-900">Add YouTube Video</h3>
            <p className="text-gray-600">(Free)</p>
          </div>
        </div>
      </div>
    </section>
  )
}
