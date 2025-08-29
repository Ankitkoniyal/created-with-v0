"use client"
import { Upload, Link, Video } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative w-full py-12 px-4 overflow-hidden bg-gray-950">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-800 via-transparent to-transparent animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-green-700 via-transparent to-transparent animate-pulse-slow delay-500"></div>
      </div>

      <div className="relative max-w-6xl mx-auto text-center z-10">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg leading-tight mb-8 animate-fade-in-up">
          Canada's Fastest Growing <span className="text-green-400 block sm:inline-block">Ads Marketplace</span>
        </h1>
        
        {/* Feature Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 justify-center items-center gap-8 max-w-4xl mx-auto mb-10">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 flex-1 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl animate-fade-in delay-300">
            <Upload className="w-10 h-10 text-green-400 mb-4 mx-auto" />
            <h3 className="font-bold text-lg text-white">Unlimited Ads (Free)</h3>
            <p className="text-sm text-gray-300">Publish as many ads as you need to grow your business.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 flex-1 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl animate-fade-in delay-400">
            <Link className="w-10 h-10 text-green-400 mb-4 mx-auto" />
            <h3 className="font-bold text-lg text-white">Website URL (Free)</h3>
            <p className="text-sm text-gray-300">Drive traffic to your own site with a direct link.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 flex-1 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl animate-fade-in delay-500">
            <Video className="w-10 h-10 text-green-400 mb-4 mx-auto" />
            <h3 className="font-bold text-lg text-white">YouTube Video (Free)</h3>
            <p className="text-sm text-gray-300">Showcase your products or services with a video.</p>
          </div>
        </div>

        {/* CTA Button - more attractive and functional */}
        <a href="/post-ad" className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white font-extrabold py-5 px-16 rounded-full text-2xl tracking-wide shadow-xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-pulse-slow">
          Post Free Ads Now!
        </a>
      </div>
    </section>
  )
}
