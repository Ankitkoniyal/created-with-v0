// components/hero-section.tsx
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative w-full py-12 px-4 bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-green-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-15"></div>
      </div>

      <div className="relative max-w-6xl mx-auto text-center z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-green-900/20 backdrop-blur-sm border border-green-700/30 rounded-full px-4 py-1.5 mb-6">
          <span className="text-sm font-medium text-green-300">#Fastest Growing Marketplace in Canada</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Post Unlimited Ads
          </span>
        </h1>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold">50K+</span>
            <span className="text-gray-400">Trusted Users</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">5K+</span>
            <span className="text-gray-400">Active Ads</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Verified</span>
            <span className="text-gray-400">Platform</span>
          </div>
        </div>

        {/* Feature Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          {/* Feature 1 */}
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 text-center border border-white/10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-700/30 rounded-full mb-3 mx-auto">
              <span className="text-green-400 text-lg">📤</span>
            </div>
            <h3 className="font-bold text-white text-base mb-1">Post for Free, Forever</h3>
            <p className="text-xs text-gray-300">Unlimited visibility with 100% free ads</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 text-center border border-white/10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-700/30 rounded-full mb-3 mx-auto">
              <span className="text-green-400 text-lg">🔗</span>
            </div>
            <h3 className="font-bold text-white text-base mb-1">Direct Website Traffic</h3>
            <p className="text-xs text-gray-300">Boost sales with direct links to your site</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 text-center border border-white/10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-700/30 rounded-full mb-3 mx-auto">
              <span className="text-green-400 text-lg">🎥</span>
            </div>
            <h3 className="font-bold text-white text-base mb-1">Video Showcases</h3>
            <p className="text-xs text-gray-300">Engage customers with video integration</p>
          </div>
        </div>

        {/* CTA Button */}
        <div>
          <Link
            href="/sell"
            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
          >
            Start Selling Now - It's Free
          </Link>
        </div>
      </div>
    </section>
  )
}
