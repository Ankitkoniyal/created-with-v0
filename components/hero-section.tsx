"use client"
import { Upload, Link, Video } from "lucide-react"

export function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-r from-green-800 to-green-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Heading - Reduced spacing */}
        <h1 className="text-3xl md:text-5xl font-bold mb-8 text-balance leading-tight">
          Canada's Fastest Growing<br />Ads Marketplace
        </h1>

        {/* Feature Cards - Made more compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 transition-all hover:bg-white/15 hover:scale-105">
            <div className="bg-green-700/80 p-2 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-base mb-1">Unlimited Ads</h3>
            <p className="text-green-200 text-sm">(Free)</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 transition-all hover:bg-white/15 hover:scale-105">
            <div className="bg-green-700/80 p-2 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Link className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-base mb-1">Add Website URL</h3>
            <p className="text-green-200 text-sm">(Free)</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 transition-all hover:bg-white/15 hover:scale-105">
            <div className="bg-green-700/80 p-2 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-base mb-1">Add YouTube Video</h3>
            <p className="text-green-200 text-sm">(Free)</p>
          </div>
        </div>

        {/* Optional CTA Button */}
        <button className="mt-8 bg-white text-green-800 font-semibold py-3 px-8 rounded-full hover:bg-green-100 transition-all transform hover:-translate-y-1">
          Get Started Today
        </button>
      </div>
    </section>
  )
}
