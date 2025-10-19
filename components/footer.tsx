// components/footer.tsx
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">MarketPlace</h3>
            <p className="text-gray-300 mb-4">
              Your trusted marketplace for buying and selling products locally.
            </p>
            <div className="flex space-x-3">
              <button className="text-gray-400 hover:text-white transition-colors">
                Facebook
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                Twitter
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                Instagram
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
              <li><Link href="/safety" className="hover:text-white">Safety Tips</Link></li>
              <li><Link href="/stories" className="hover:text-white">Success Stories</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/category/cars" className="hover:text-white">Cars</Link></li>
              <li><Link href="/category/electronics" className="hover:text-white">Electronics</Link></li>
              <li><Link href="/category/property" className="hover:text-white">Property</Link></li>
              <li><Link href="/category/fashion" className="hover:text-white">Fashion</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="space-y-2 text-gray-300">
              <div>support@marketplace.com</div>
              <div>1-800-MARKET</div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 MarketPlace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
