"use client"
import { Upload, Link, Video } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative w-full py-15 px-4 overflow-hidden bg-gray-950">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-800 via-transparent to-transparent animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-green-700 via-transparent to-transparent animate-pulse-slow delay-500"></div>
      </div>

      <div className="relative max-w-6xl mx-auto text-center z-10">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg leading-tight mb-4 animate-fade-in-up">
          Canada's Fastest Growing <span className="text-green-800 block sm:inline-block">Ads Marketplace</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-green-200 font-medium mb-12 animate-fade-in-up delay-200">
          Post your ads for free and reach thousands of users today.
        </p>

        {/* Feature Sections with Improved Design */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 max-w-4xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 flex-1 text-left border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl animate-fade-in delay-300">
            <Upload className="w-8 h-6 text-green-400 mb-2" />
            <h3 className="font-bold text-lg text-white">Unlimited Ads (Free)</h3>
            <p className="text-sm text-gray-300">Publish as many ads as you need to grow your business.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 flex-1 text-left border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl animate-fade-in delay-400">
            <Link className="w-8 h-8 text-green-400 mb-2" />
            <h3 className="font-bold text-lg text-white">Website URL (Free)</h3>
            <p className="text-sm text-gray-300">Drive traffic to your own site with a direct link.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 flex-1 text-left border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl animate-fade-in delay-500">
            <Video className="w-8 h-8 text-green-400 mb-2" />
            <h3 className="font-bold text-lg text-white">YouTube Video (Free)</h3>
            <p className="text-sm text-gray-300">Showcase your products or services with a video.</p>
          </div>
        </div>

        {/* CTA Button */}
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-12 rounded-full text-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-bounce-slow mb-4">
          Post Free Ads Now
        </button>

        {/* Subtle Subtext */}
        <p className="text-gray-400 text-sm italic animate-fade-in delay-700">
          No credit card required. Start today in minutes!
        </p>
      </div>
    </section>
  )
}
