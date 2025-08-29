"use client"
import { Upload, Link, Video } from "lucide-react"

export function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-r from-green-800 to-green-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-3xl md:text-5xl font-bold mb-2 text-balance leading-tight">
          Canada's Fastest Growing
        </h1>
        <h2 className="text-2xl md:text-4xl font-semibold mb-8 text-green-200">
          Ads Marketplace
        </h2>

        {/* Feature Cards - Made to stand out */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-xl p-5 text-center shadow-lg border-2 border-green-500 transition-all hover:shadow-xl hover:scale-105">
            <div className="bg-green-700 p-3 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-gray-900">Unlimited Ads</h3>
            <p className="text-green-700 font-medium">(Free)</p>
          </div>

          <div className="bg-white rounded-xl p-5 text-center shadow-lg border-2 border-green-500 transition-all hover:shadow-xl hover:scale-105">
            <div className="bg-green-700 p-3 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <Link className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-gray-900">Add Website URL</h3>
            <p className="text-green-700 font-medium">(Free)</p>
          </div>

          <div className="bg-white rounded-xl p-5 text-center shadow-lg border-2 border-green-500 transition-all hover:shadow-xl hover:scale-105">
            <div className="bg-green-700 p-3 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <Video className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-gray-900">Add YouTube Video</h3>
            <p className="text-green-700 font-medium">(Free)</p>
          </div>
        </div>

        {/* CTA Button - Improved visibility */}
        <button className="bg-green-500 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-green-400 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl">
          Post Free Ads
        </button>
      </div>
    </section>
  )
}
